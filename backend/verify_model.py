"""
DeepfakeGuard - Model Verification Script
Proves the backend returns real, meaningful predictions — not random answers.

Tests:
1. Pure sine wave (artificial/robotic) → should lean toward "AI"
2. White noise (random) → should be ambiguous
3. Multiple requests → results should be CONSISTENT (not random)
4. Compares metrics across different audio types

Usage:
    python verify_model.py [--url http://localhost:8000]
"""

import sys
import json
import math
import struct
import io
import time
import urllib.request
import statistics

# ─── Configuration ─────────────────────────────────────────
BACKEND_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
DETECT_URL = f"{BACKEND_URL}/api/detect"


# ─── Audio Generation Helpers ──────────────────────────────
def create_wav(samples, sample_rate=16000):
    """Create a WAV file bytes from a list of float samples [-1, 1]."""
    buf = io.BytesIO()
    num = len(samples)
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + num * 2))
    buf.write(b"WAVE")
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))
    buf.write(struct.pack("<H", 1))   # PCM
    buf.write(struct.pack("<H", 1))   # Mono
    buf.write(struct.pack("<I", sample_rate))
    buf.write(struct.pack("<I", sample_rate * 2))
    buf.write(struct.pack("<H", 2))
    buf.write(struct.pack("<H", 16))
    buf.write(b"data")
    buf.write(struct.pack("<I", num * 2))
    for s in samples:
        clamped = max(-1.0, min(1.0, s))
        buf.write(struct.pack("<h", int(clamped * 32767)))
    return buf.getvalue()


def generate_sine_wave(freq=440, duration=3, sr=16000):
    """Pure sine wave — sounds robotic/artificial."""
    return [math.sin(2 * math.pi * freq * i / sr) for i in range(sr * duration)]


def generate_white_noise(duration=3, sr=16000):
    """Random white noise — no structure."""
    import random
    random.seed(42)
    return [random.uniform(-0.5, 0.5) for _ in range(sr * duration)]


def generate_multitone(duration=3, sr=16000):
    """Multiple harmonics — closer to natural voice harmonics."""
    samples = []
    for i in range(sr * duration):
        t = i / sr
        # Fundamental + harmonics (like a rough voice)
        s = (0.5 * math.sin(2 * math.pi * 150 * t) +
             0.3 * math.sin(2 * math.pi * 300 * t) +
             0.15 * math.sin(2 * math.pi * 450 * t) +
             0.05 * math.sin(2 * math.pi * 600 * t))
        # Add slight randomness
        import random
        random.seed(i)
        s += random.uniform(-0.02, 0.02)
        samples.append(s)
    return samples


def generate_silence(duration=3, sr=16000):
    """Near-silence — should not trigger strong classification."""
    import random
    random.seed(42)
    return [random.uniform(-0.001, 0.001) for _ in range(sr * duration)]


# ─── Send to Backend ───────────────────────────────────────
def send_audio(samples, filename="test.wav"):
    """Send audio to the backend and return the parsed response."""
    wav_data = create_wav(samples)
    boundary = "----VerifyBoundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="audio"; filename="{filename}"\r\n'
        f"Content-Type: audio/wav\r\n\r\n"
    ).encode() + wav_data + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        DETECT_URL,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())


# ─── Print Helpers ─────────────────────────────────────────
def print_result(label, result, elapsed):
    is_ai = result["is_ai"]
    conf = result["confidence"]
    authentic = result["isAuthentic"]
    m = result["metrics"]

    verdict = "AI/FAKE" if is_ai else "HUMAN/REAL"
    icon = "!" if is_ai else "+"

    print(f"  [{icon}] {label}")
    print(f"      Verdict:      {verdict} (confidence: {conf}%)")
    print(f"      isAuthentic:  {authentic}")
    print(f"      Duration:     {result['duration_seconds']}s")
    print(f"      Pitch anomaly:{m['pitch_anomaly']}")
    print(f"      Spectral cent:{m['spectral_centroid']}")
    print(f"      MFCC var:     {m['mfcc_variance']}")
    print(f"      RMS energy:   {m['rms_energy']}")
    print(f"      Time:         {elapsed:.1f}s")
    print()


# ─── Main Verification ─────────────────────────────────────
def main():
    print("=" * 65)
    print("  DeepfakeGuard - Model Verification Script")
    print("=" * 65)
    print(f"  Backend URL: {DETECT_URL}")
    print()

    # Test 0: Check backend is alive
    print("[0] Checking backend health...")
    try:
        req = urllib.request.Request(f"{BACKEND_URL}/health")
        resp = urllib.request.urlopen(req, timeout=5)
        health = json.loads(resp.read())
        if not health.get("model_loaded"):
            print("  ERROR: Model not loaded! Run: python main.py")
            sys.exit(1)
        print(f"  OK: Model loaded ({health['model_name']})")
        print()
    except Exception as e:
        print(f"  ERROR: Cannot reach backend at {BACKEND_URL}")
        print(f"  {e}")
        print("  Start the backend first: cd backend && python main.py")
        sys.exit(1)

    results = {}

    # Test 1: Pure sine wave (robotic/artificial signal)
    print("[1] Testing pure sine wave (440Hz robotic tone)...")
    t0 = time.time()
    r = send_audio(generate_sine_wave(440, 3), "sine_440hz.wav")
    elapsed = time.time() - t0
    print_result("Pure Sine Wave (440Hz, 3s)", r, elapsed)
    results["sine"] = r

    # Test 2: White noise (random, no structure)
    print("[2] Testing white noise...")
    t0 = time.time()
    r = send_audio(generate_white_noise(3), "white_noise.wav")
    elapsed = time.time() - t0
    print_result("White Noise (3s)", r, elapsed)
    results["noise"] = r

    # Test 3: Multi-harmonic tone (closer to voice-like)
    print("[3] Testing multi-harmonic signal (voice-like)...")
    t0 = time.time()
    r = send_audio(generate_multitone(3), "multitone.wav")
    elapsed = time.time() - t0
    print_result("Multi-Harmonic Tone (3s)", r, elapsed)
    results["multitone"] = r

    # Test 4: Near-silence
    print("[4] Testing near-silence...")
    t0 = time.time()
    r = send_audio(generate_silence(3), "silence.wav")
    elapsed = time.time() - t0
    print_result("Near-Silence (3s)", r, elapsed)
    results["silence"] = r

    # Test 5: CONSISTENCY — Send the same file 5 times
    print("[5] Testing CONSISTENCY (same file, 5 requests)...")
    print("  If predictions are random, these will vary wildly.")
    print()
    sine_samples = generate_sine_wave(440, 3)
    confidences = []
    verdicts = []
    for i in range(5):
        t0 = time.time()
        r = send_audio(sine_samples, f"consistency_{i}.wav")
        elapsed = time.time() - t0
        confidences.append(r["confidence"])
        verdicts.append(r["is_ai"])
        print(f"    Run {i+1}: is_ai={r['is_ai']}, confidence={r['confidence']}%, "
              f"pitch={r['metrics']['pitch_anomaly']:.4f}, "
              f"spectral={r['metrics']['spectral_centroid']:.1f}, "
              f"time={elapsed:.1f}s")

    conf_stdev = statistics.stdev(confidences) if len(confidences) > 1 else 0
    all_same_verdict = len(set(verdicts)) == 1

    print()
    print(f"  Confidence values: {confidences}")
    print(f"  Std deviation:     {conf_stdev:.2f}%")
    print(f"  All same verdict:  {all_same_verdict}")
    print()

    if conf_stdev < 5.0 and all_same_verdict:
        print("  PASS: Predictions are CONSISTENT (not random)")
    elif conf_stdev < 10.0:
        print("  WARN: Slight variation but mostly consistent")
    else:
        print("  FAIL: Predictions are inconsistent — possible random behavior!")
    print()

    # Summary
    print("=" * 65)
    print("  SUMMARY")
    print("=" * 65)
    print()
    print("  How to interpret these results:")
    print()
    print("  - is_ai=True  means the model detected AI/synthetic audio")
    print("  - is_ai=False means the model detected human/natural audio")
    print("  - confidence is the model's certainty (0-100%)")
    print()
    print("  Key indicators the model is working correctly:")
    print("  1. Different audio types produce DIFFERENT results")
    print("  2. The same audio produces CONSISTENT results")
    print("  3. Metrics (pitch, spectral, MFCC) vary meaningfully")
    print()
    print("  If you upload REAL audio files:")
    print("  - Put human voices in: backend/data/real/")
    print("  - Put AI voices in:    backend/data/ai_generated/")
    print("  - Then test with: python verify_model.py")
    print()
    print("=" * 65)


if __name__ == "__main__":
    main()
