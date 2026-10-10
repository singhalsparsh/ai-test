"""
Functional smoke test for audio_gatekeeper.py

Synthesizes a set of pathological + valid clips and runs the gated pipeline
over each. No network or pretrained deepfake model required -- this validates
Gates 1-3 and the confidence-banding helper only.
"""
import os
import sys
import wave
import struct
import random

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_gatekeeper as gk

SR = 16000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_gate_test_files")
os.makedirs(OUT, exist_ok=True)


def _write_wav(path, samples, sr=SR):
    """Write float32 [-1,1] samples as a 16-bit PCM wav."""
    clipped = np.clip(samples, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype("<i2")
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())
    return path


def _t(seconds):
    return np.linspace(0, seconds, int(SR * seconds), endpoint=False)


def synth_speech(seconds=4.0, f0=150.0):
    """Roughly speech-like: harmonic stack + amplitude modulation + jitter."""
    t = _t(seconds)
    jitter = 1.0 + 0.02 * np.sin(2 * np.pi * 5 * t)
    sig = np.zeros_like(t)
    for h in (1, 2, 3, 4, 5):
        sig += np.sin(2 * np.pi * f0 * h * jitter * t) / h
    # syllabic amplitude modulation (~4 Hz), plus pauses
    env = 0.5 + 0.5 * np.maximum(np.sin(2 * np.pi * 4 * t), 0.0)
    sig *= env
    noise = np.random.default_rng(0).normal(0, 0.01, len(t))
    return (sig / np.max(np.abs(sig)) * 0.6) + noise


def synth_tone(seconds=3.0, freq=440.0):
    t = _t(seconds)
    return 0.5 * np.sin(2 * np.pi * freq * t)


# ---------------------------------------------------------------- builds
def build_files():
    files = {}

    # 1. digital silence -> corrupted/empty
    files["silence.wav"] = _write_wav(
        os.path.join(OUT, "silence.wav"), np.zeros(int(SR * 3)))

    # 2. extremely short
    files["short.wav"] = _write_wav(
        os.path.join(OUT, "short.wav"), synth_tone(0.8))

    # 3. hard clipping -> poor quality (peg at full scale)
    raw = synth_speech(3.0) * 6.0
    files["clipped.wav"] = _write_wav(
        os.path.join(OUT, "clipped.wav"), np.clip(raw, -1.0, 1.0))

    # 4. severe DC offset -> poor quality
    files["dc_offset.wav"] = _write_wav(
        os.path.join(OUT, "dc_offset.wav"), synth_speech(3.0) + 0.6)

    # 5. white noise -> Gate 3 non-speech
    rng = np.random.default_rng(1)
    files["noise.wav"] = _write_wav(
        os.path.join(OUT, "noise.wav"), rng.normal(0, 0.3, int(SR * 3)))

    # 6. pure sustained tone (music-like) -> Gate 3 non-speech
    files["tone.wav"] = _write_wav(
        os.path.join(OUT, "tone.wav"), synth_tone(3.0, 220.0))

    # 7. speech padded with leading/trailing silence -> trim, then PASS
    speech = synth_speech(3.0)
    pad = np.zeros(int(SR * 1.2))
    files["padded_speech.wav"] = _write_wav(
        os.path.join(OUT, "padded_speech.wav"), np.concatenate([pad, speech, pad]))

    # 8. clean speech -> PASS all gates
    files["speech.wav"] = _write_wav(
        os.path.join(OUT, "speech.wav"), synth_speech(4.0))

    # 9. short-burst speech (<1500ms actual speech) -> Gate 2 blank audio
    burst = synth_speech(0.6)
    pad2 = np.zeros(int(SR * 2.4))
    files["tiny_burst.wav"] = _write_wav(
        os.path.join(OUT, "tiny_burst.wav"), np.concatenate([burst, pad2]))

    # 10. literally corrupt file (garbage bytes, .wav header)
    p = os.path.join(OUT, "corrupt.wav")
    with open(p, "wb") as fh:
        fh.write(bytes(random.Random(2).randint(0, 255) for _ in range(4096)))
    files["corrupt.wav"] = p

    return files


def main():
    files = build_files()
    print("gate availability:", gk.gate_availability())
    print()

    for name, path in files.items():
        print("=" * 66)
        print(f"FILE: {name}")
        try:
            rep = gk.run_gates(path)
        except Exception as exc:  # noqa: BLE001
            print(f"  !! run_gates raised {type(exc).__name__}: {exc}")
            continue

        print(f"  status     : {rep.status}")
        print(f"  reason     : {rep.reason}")
        print(f"  gate       : {rep.gate}")
        print(f"  duration   : {rep.original_duration_seconds:.2f}s -> "
              f"{rep.duration_seconds:.2f}s (trimmed)")
        print(f"  speech_ms  : {rep.speech_ms}")
        print(f"  audio_event: {rep.audio_event}")
        for ev in rep.events:
            tag = "PASS  " if ev.passed else "REJECT"
            extra = f" -> {ev.reason}" if ev.reason else ""
            det = f"  | {ev.detail}" if ev.detail else ""
            print(f"  [{tag}] {ev.gate}{extra}{det}")
        if rep.notes:
            print("  notes:")
            for n in rep.notes[:6]:
                print(f"        - {n}")

    # ----------------------------------------------------------
    print()
    print("=" * 66)
    print("CONFIDENCE BANDING (Gate 4 helper)")
    for pct in (49.0, 50.0, 62.5, 79.9, 80.0, 80.01, 99.0):
        print(f"  {pct:6.2f}% -> {gk.band_confidence(pct)}")

    # ----------------------------------------------------------
    print()
    print("=" * 66)
    print("MASTER SWITCH (DEEPFAKE_GATE_ENABLED=0 must bypass gates)")
    os.environ["DEEPFAKE_GATE_ENABLED"] = "0"
    import importlib
    importlib.reload(gk)
    rep = gk.run_gates(files["silence.wav"])
    print(f"  disabled -> status={rep.status} "
          f"(audio loaded: {rep.audio is not None}, notes={rep.notes})")
    os.environ["DEEPFAKE_GATE_ENABLED"] = "1"
    importlib.reload(gk)
    rep = gk.run_gates(files["silence.wav"])
    print(f"  enabled  -> status={rep.status} reason={rep.reason}")

    print()
    print("SMOKE TEST COMPLETE")


if __name__ == "__main__":
    main()
