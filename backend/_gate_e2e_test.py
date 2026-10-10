"""
End-to-end test of the /api/detect + /api/v1/detect contract after wiring in
the Multi-Stage Gated Pipeline.

Boots the FastAPI app in-process (TestClient) and posts synthesized clips,
asserting:
  * rejections come back HTTP 200 with status="REJECTED" + reason (so the
    frontend never falls back to filename heuristics)
  * valid speech reaches Gate 4 and returns SUCCESS or INCONCLUSIVE
  * the legacy /api/v1/detect route behaves identically
  * /health reports gate capabilities
"""
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
import main as backend

SR = 16000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_gate_test_files")
os.makedirs(OUT, exist_ok=True)


def write_wav(path, samples):
    pcm = (np.clip(samples, -1.0, 1.0) * 32767.0).astype("<i2")
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())
    return path


def synth_speech(seconds=4.0, f0=150.0):
    t = np.linspace(0, seconds, int(SR * seconds), endpoint=False)
    jitter = 1.0 + 0.02 * np.sin(2 * np.pi * 5 * t)
    sig = np.zeros_like(t)
    for h in (1, 2, 3, 4, 5):
        sig += np.sin(2 * np.pi * f0 * h * jitter * t) / h
    env = 0.5 + 0.5 * np.maximum(np.sin(2 * np.pi * 4 * t), 0.0)
    sig *= env
    sig = sig / np.max(np.abs(sig)) * 0.6
    return sig + np.random.default_rng(0).normal(0, 0.01, len(t))


def main():
    client = TestClient(backend.app)

    # ------------------------------------------------ health
    print("=" * 66)
    r = client.get("/health")
    print("GET /health ->", r.status_code)
    body = r.json()
    print("  model_loaded      :", body.get("model_loaded"))
    print("  gate_pipeline     :", body.get("gate_pipeline_enabled"))
    print("  gate_capabilities :", body.get("gate_capabilities"))
    assert r.status_code == 200
    assert "gate_capabilities" in body

    # ------------------------------------------------ cases
    cases = [
        ("silence.wav", np.zeros(int(SR * 3)), "Corrupted or empty file."),
        ("short.wav", 0.5 * np.sin(2 * np.pi * 440 * np.linspace(0, 0.8, int(SR * 0.8), endpoint=False)),
         "Extremely short utterance."),
        ("clipped.wav", np.clip(synth_speech(3.0) * 6.0, -1.0, 1.0), "Poor audio quality."),
        ("noise.wav", np.random.default_rng(1).normal(0, 0.3, int(SR * 3)),
         "Blank audio or no speech detected."),
        ("speech.wav", synth_speech(4.0), None),  # should reach Gate 4
    ]

    paths = {name: write_wav(os.path.join(OUT, name), samples) for name, samples, _ in cases}

    expectations = {name: expected for name, _, expected in cases}

    for name, _, _ in cases:
        print("=" * 66)
        print(f"POST /api/detect  file={name}")
        with open(paths[name], "rb") as fh:
            r = client.post(
                "/api/detect",
                files={"audio": (name, fh, "audio/wav")},
            )

        print("  status_code :", r.status_code)
        data = r.json()
        print("  is_ai       :", data["is_ai"])
        print("  isAuthentic :", data["isAuthentic"])
        print("  confidence  :", data["confidence"])
        print("  model_used  :", data["model_used"])
        print("  status      :", data.get("status"))
        print("  reason      :", data.get("reason"))
        print("  gate        :", data.get("gate"))
        print("  speech_ms   :", data.get("speech_ms"))
        print("  has gates[] :", data.get("gates") is not None)

        # contract invariants
        assert r.status_code == 200, "rejections must stay HTTP 200 (see comment in _detect_handler)"
        assert set(("is_ai", "isAuthentic", "confidence", "metrics",
                    "filename", "duration_seconds", "model_used")) <= set(data.keys()), \
            "legacy fields must all still be present"
        assert data.get("status") in ("SUCCESS", "REJECTED", "INCONCLUSIVE")

        expected = expectations[name]
        if expected is not None:
            assert data.get("status") == "REJECTED", f"{name}: expected REJECTED"
            assert data.get("reason") == expected, \
                f"{name}: reason {data.get('reason')!r} != {expected!r}"
            # a rejection must never claim a scam alert
            assert data["is_ai"] is False
            assert data["confidence"] == 0.0
        else:
            assert data.get("status") in ("SUCCESS", "INCONCLUSIVE"), f"{name}: {data.get('status')}"
        print("  -> ASSERTIONS PASSED")

    # ------------------------------------------------ legacy route parity
    print("=" * 66)
    with open(paths["speech.wav"], "rb") as fh:
        r1 = client.post("/api/detect", files={"audio": ("speech.wav", fh, "audio/wav")})
    with open(paths["speech.wav"], "rb") as fh:
        r2 = client.post("/api/v1/detect", files={"file": ("speech.wav", fh, "audio/wav")})
    d1, d2 = r1.json(), r2.json()
    print("legacy route parity:",
          "is_ai", d1["is_ai"] == d2["is_ai"],
          "| confidence", d1["confidence"] == d2["confidence"],
          "| status", d1.get("status") == d2.get("status"))
    assert d1["is_ai"] == d2["is_ai"] and d1["confidence"] == d2["confidence"]
    assert d1.get("status") == d2.get("status")

    # ------------------------------------------------ response model export
    print("=" * 66)
    sample = backend.DetectionResponse(
        is_ai=False, isAuthentic=True, confidence=0.0,
        metrics=backend.DetectionMetrics(
            pitch_anomaly=0.0, spectral_centroid=0.0, mfcc_variance=0.0,
            zero_crossing_rate=0.0, spectral_rolloff=0.0,
            spectral_bandwidth=0.0, rms_energy=0.0,
        ),
        filename="x.wav", duration_seconds=0.0, model_used="m",
        status="REJECTED", reason="Non-speech audio detected: Music.",
    )
    dumped = sample.model_dump()
    assert dumped["status"] == "REJECTED"
    assert dumped["reason"] == "Non-speech audio detected: Music."
    assert dumped["gates"] is None and dumped["transcript"] is None
    print("DetectionResponse optional-gate defaults serialize cleanly:",
          {k: dumped[k] for k in ("status", "reason", "gates", "transcript", "speech_ms")})

    print()
    print("ALL END-TO-END ASSERTIONS PASSED")


if __name__ == "__main__":
    main()
