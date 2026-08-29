"""
Midas AI — Voice Deepfake Detection Model Training

Trains a classifier to distinguish real human voices from AI-generated voices.
Uses 130+ acoustic features including MFCCs, spectral, temporal, and chroma features.

Dataset structure:
    data/
    ├── real/          # Natural human voice recordings
    └── ai_generated/  # AI-generated / deepfake voice recordings

Usage:
    python train_model.py --data_dir ./data --output ./models/voice_classifier.pkl

Requirements:
    pip install librosa scikit-learn numpy xgboost
"""

import argparse
import json
import logging
import pickle
import sys
import time
import warnings
from pathlib import Path

import librosa
import numpy as np
from sklearn.ensemble import (
    GradientBoostingClassifier,
    RandomForestClassifier,
    VotingClassifier,
)
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

warnings.filterwarnings('ignore')

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

# ─── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("train")

# ─── Audio extensions ────────────────────────────────────────
AUDIO_EXTS = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac"}


# ═══════════════════════════════════════════════════════════════
# Feature Extraction
# ═══════════════════════════════════════════════════════════════

def extract_features(audio_path: str, sr: int = 22050):
    """
    Extract a fixed-length feature vector (130 dimensions) from an audio file.

    Features:
      - MFCCs (20 coeffs × 4 stats) = 80
      - Spectral centroid, rolloff, bandwidth, contrast, flatness (×2 stats) = 10
      - Temporal: ZCR, RMS energy (×2 stats) = 4
      - Pitch: mean, std = 2
      - Chroma (12 bins × 2 stats) = 24
      - Onset strength: mean, std = 2
      - Spectral contrast mean per band (7 bands) = 7
      Total ≈ 129 features
    """
    try:
        y, sr = librosa.load(audio_path, sr=sr, duration=30, mono=True)
    except Exception as e:
        log.warning(f"  Failed to load {Path(audio_path).name}: {e}")
        return None

    # Skip very short audio (< 0.5s)
    if len(y) < sr * 0.5:
        log.warning(f"  Skipping {Path(audio_path).name}: too short ({len(y)/sr:.2f}s)")
        return None

    # Pad short audio to at least 1 second
    if len(y) < sr:
        y = np.pad(y, (0, sr - len(y)))

    # MFCCs — 20 coefficients
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
    mfcc_mean = np.mean(mfccs, axis=1)
    mfcc_std = np.std(mfccs, axis=1)
    mfcc_delta_mean = np.mean(librosa.feature.delta(mfccs), axis=1)
    mfcc_delta_std = np.std(librosa.feature.delta(mfccs), axis=1)

    # Spectral features
    spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    spec_roll = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
    spec_bw = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
    spec_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    spec_flatness = librosa.feature.spectral_flatness(y=y)[0]

    # Temporal features
    zcr = librosa.feature.zero_crossing_rate(y)[0]
    rms = librosa.feature.rms(y=y)[0]

    # Pitch
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    mag_mask = magnitudes > np.median(magnitudes[magnitudes > 0]) if np.any(magnitudes > 0) else magnitudes > 0
    pitch_values = pitches[mag_mask]
    pitch_mean = float(np.mean(pitch_values)) if len(pitch_values) > 0 else 0.0
    pitch_std = float(np.std(pitch_values)) if len(pitch_values) > 0 else 0.0

    # Chroma
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)
    chroma_std = np.std(chroma, axis=1)

    # Onset strength
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_mean = float(np.mean(onset_env))
    onset_std = float(np.std(onset_env))

    # Assemble feature vector
    features = np.concatenate([
        mfcc_mean,              # 20
        mfcc_std,               # 20
        mfcc_delta_mean,        # 20
        mfcc_delta_std,         # 20
        [np.mean(spec_cent), np.std(spec_cent)],
        [np.mean(spec_roll), np.std(spec_roll)],
        [np.mean(spec_bw), np.std(spec_bw)],
        [np.mean(spec_contrast), np.std(spec_contrast)],
        [np.mean(spec_flatness), np.std(spec_flatness)],
        [np.mean(zcr), np.std(zcr)],
        [np.mean(rms), np.std(rms)],
        [pitch_mean, pitch_std],
        chroma_mean,            # 12
        chroma_std,             # 12
        [onset_mean, onset_std],
    ])

    return features.astype(np.float32)


# ═══════════════════════════════════════════════════════════════
# Data Augmentation (feature-space)
# ═══════════════════════════════════════════════════════════════

def augment_features(X: np.ndarray, y: np.ndarray, noise_factor: float = 0.05, n_augmented: int = 2):
    """
    Augment training data by adding Gaussian noise to feature vectors.
    This helps prevent overfitting on small datasets.
    """
    X_aug = [X]
    y_aug = [y]

    for i in range(n_augmented):
        noise = np.random.normal(0, noise_factor, X.shape).astype(np.float32)
        X_noisy = X + noise * np.std(X, axis=0)
        X_aug.append(X_noisy)
        y_aug.append(y.copy())

    return np.vstack(X_aug), np.concatenate(y_aug)


# ═══════════════════════════════════════════════════════════════
# Balance Dataset
# ═══════════════════════════════════════════════════════════════

def balance_dataset(X: np.ndarray, y: np.ndarray):
    """Balance dataset by augmenting minority class"""
    real_indices = np.where(y == 0)[0]
    ai_indices = np.where(y == 1)[0]
    
    real_count = len(real_indices)
    ai_count = len(ai_indices)
    
    if real_count == 0 or ai_count == 0:
        return X, y
    
    # Target: at least 50 real samples or 30% of AI count
    target_real = min(max(50, int(ai_count * 0.3)), 500)
    
    if real_count < target_real and real_count > 0:
        print(f"   Augmenting real samples: {real_count} → {target_real}")
        
        X_aug = list(X)
        y_aug = list(y)
        
        # Augment real samples
        while sum(np.array(y_aug) == 0) < target_real:
            for idx in real_indices:
                sample = X[idx]
                # Multiple noise levels
                for noise_scale in [0.02, 0.04, 0.06, 0.08]:
                    noise = np.random.normal(0, noise_scale, sample.shape)
                    X_aug.append(sample + noise * np.std(sample))
                    y_aug.append(0)
                    if sum(np.array(y_aug) == 0) >= target_real:
                        break
                if sum(np.array(y_aug) == 0) >= target_real:
                    break
        
        X = np.array(X_aug)
        y = np.array(y_aug)
    
    return X, y


# ═══════════════════════════════════════════════════════════════
# Dataset Loading
# ═══════════════════════════════════════════════════════════════

def load_dataset(data_dir: str):
    """Load audio files from data/real/ and data/ai_generated/."""
    data_path = Path(data_dir)
    real_dir = data_path / "real"
    ai_dir = data_path / "ai_generated"

    if not real_dir.exists():
        log.error(f"Directory not found: {real_dir}")
        sys.exit(1)
    if not ai_dir.exists():
        log.error(f"Directory not found: {ai_dir}")
        sys.exit(1)

    features_list = []
    labels = []

    # Real audio (label = 0)
    real_files = [f for f in real_dir.iterdir() if f.suffix.lower() in AUDIO_EXTS]
    log.info(f"Found {len(real_files)} real audio files in {real_dir}")
    for i, fpath in enumerate(real_files):
        log.info(f"  [{i+1}/{len(real_files)}] {fpath.name}...")
        feat = extract_features(str(fpath))
        if feat is not None:
            features_list.append(feat)
            labels.append(0)  # REAL = 0

    # AI-generated audio (label = 1)
    ai_files = [f for f in ai_dir.iterdir() if f.suffix.lower() in AUDIO_EXTS]
    log.info(f"Found {len(ai_files)} AI-generated audio files in {ai_dir}")
    for i, fpath in enumerate(ai_files):
        log.info(f"  [{i+1}/{len(ai_files)}] {fpath.name}...")
        feat = extract_features(str(fpath))
        if feat is not None:
            features_list.append(feat)
            labels.append(1)  # AI = 1

    if len(features_list) == 0:
        log.error("No valid audio files found. Check your dataset directories.")
        sys.exit(1)

    X = np.array(features_list)
    y = np.array(labels)

    log.info(f"Dataset: {len(X)} samples  |  {np.sum(y == 0)} real  |  {np.sum(y == 1)} AI")
    return X, y


# ═══════════════════════════════════════════════════════════════
# Model Training & Evaluation
# ═══════════════════════════════════════════════════════════════

def train_and_evaluate(X: np.ndarray, y: np.ndarray, output_path: str, augment: bool = True):
    """Train multiple models, pick the best, save it with metrics."""

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    log_dir = output.parent / "logs"
    log_dir.mkdir(exist_ok=True)

    # Check if we have both classes
    unique_classes = np.unique(y)
    if len(unique_classes) < 2:
        log.error(f"❌ Need both REAL (0) and AI (1) samples. Found only: {unique_classes}")
        log.error("   Please add both real and AI audio files to train.")
        sys.exit(1)

    # Balance dataset
    X, y = balance_dataset(X, y)
    
    # Augment if dataset is small
    if augment and len(X) < 200:
        log.info(f"Augmenting small dataset ({len(X)} samples → 3×)")
        X, y = augment_features(X, y, noise_factor=0.05, n_augmented=2)
        log.info(f"Augmented: {len(X)} samples")

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Stratified split - handle small dataset
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
    except ValueError:
        # Fallback for very small datasets
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )

    log.info(f"Train: {len(X_train)}  |  Test: {len(X_test)}")

    # Define models
    models = {
        "RandomForest": RandomForestClassifier(
            n_estimators=300, max_depth=None, min_samples_split=3,
            min_samples_leaf=1, random_state=42, n_jobs=-1,
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.1,
            subsample=0.8, random_state=42,
        ),
        "SVM-RBF": SVC(
            kernel="rbf", C=10, gamma="scale", probability=True, random_state=42,
        ),
    }

    if HAS_XGBOOST:
        models["XGBoost"] = XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8,
            eval_metric="logloss", random_state=42, n_jobs=-1,
        )

    # Train & evaluate each
    results = {}
    best_name = None
    best_acc = 0
    best_model = None

    for name, model in models.items():
        log.info(f"\n{'='*50}")
        log.info(f"Training {name}...")

        # Cross-validation - handle small datasets
        try:
            # Get the minimum class count for CV
            min_class = min(np.bincount(y_train))
            n_splits = min(3, min_class) if min_class >= 2 else 2
            
            if n_splits >= 2:
                cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
                cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="accuracy")
                cv_mean = cv_scores.mean() * 100
                cv_std = cv_scores.std() * 100
            else:
                cv_mean = 0
                cv_std = 0
        except Exception as e:
            log.warning(f"  CV skipped: {e}")
            cv_mean = 0
            cv_std = 0

        # Fit
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average="weighted")
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)

        results[name] = {
            "accuracy": round(acc * 100, 2),
            "f1_score": round(f1 * 100, 2),
            "precision": round(prec * 100, 2),
            "recall": round(rec * 100, 2),
            "cv_mean": round(cv_mean, 2),
            "cv_std": round(cv_std, 2),
        }

        log.info(f"  Test Accuracy:  {acc*100:.1f}%")
        log.info(f"  F1 Score:       {f1*100:.1f}%")
        log.info(f"  CV:             {cv_mean:.1f}% ± {cv_std:.1f}%")
        
        if len(np.unique(y_test)) >= 2:
            log.info(f"  Classification Report:")
            log.info(f"\n{classification_report(y_test, y_pred, target_names=['Real', 'AI-Generated'], zero_division=0)}")

        if acc > best_acc:
            best_acc = acc
            best_name = name
            best_model = model

    # Ensemble of top 2 (if we have at least 2 models)
    if len(models) >= 2:
        sorted_models = sorted(results.items(), key=lambda x: x[1]["accuracy"], reverse=True)
        top_two = [n for n, _ in sorted_models[:2]]
        
        if len(top_two) >= 2:
            log.info(f"\n{'='*50}")
            log.info(f"Building ensemble from: {top_two}")
            estimators = [(n, models[n]) for n in top_two]
            ensemble = VotingClassifier(estimators=estimators, voting="soft")
            ensemble.fit(X_train, y_train)
            y_pred_e = ensemble.predict(X_test)
            acc_e = accuracy_score(y_test, y_pred_e)
            results["Ensemble"] = {
                "accuracy": round(acc_e * 100, 2),
                "f1_score": round(f1_score(y_test, y_pred_e, average="weighted") * 100, 2),
            }
            log.info(f"  Ensemble Accuracy: {acc_e*100:.1f}%")
            if acc_e > best_acc:
                best_acc = acc_e
                best_name = "Ensemble"
                best_model = ensemble

    # Save
    model_data = {
        "model": best_model,
        "scaler": scaler,
        "model_name": best_name,
        "accuracy": best_acc,
        "feature_count": int(X.shape[1]),
        "trained_at": timestamp,
        "results": results,
    }

    with open(output, "wb") as f:
        pickle.dump(model_data, f)

    # Save metrics JSON
    metrics_path = log_dir / f"metrics_{timestamp}.json"
    with open(metrics_path, "w") as f:
        json.dump({
            "best_model": best_name,
            "best_accuracy": round(best_acc * 100, 2),
            "feature_count": int(X.shape[1]),
            "samples": int(len(X)),
            "all_results": results,
        }, f, indent=2)

    log.info(f"\n{'='*50}")
    log.info(f"✅ Best model: {best_name} ({best_acc*100:.1f}% accuracy)")
    log.info(f"💾 Saved to: {output}")
    log.info(f"📊 Metrics: {metrics_path}")

    return best_model


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Train Midas AI voice deepfake detection model",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python train_model.py --data_dir ./data --output ./models/voice_classifier.pkl
  python train_model.py --data_dir /path/to/dataset --output /path/to/model.pkl --no-augment
        """,
    )
    parser.add_argument("--data_dir", type=str, default="./data",
                        help="Dataset root with real/ and ai_generated/ subdirs")
    parser.add_argument("--output", type=str, default="./models/voice_classifier.pkl",
                        help="Output path for trained model")
    parser.add_argument("--no-augment", action="store_true",
                        help="Disable feature-space data augmentation")
    args = parser.parse_args()

    log.info("🎙️  Midas AI — Voice Deepfake Detection Training")
    log.info("=" * 55)
    log.info(f"  Data dir:  {args.data_dir}")
    log.info(f"  Output:    {args.output}")
    log.info(f"  Augment:   {not args.no_augment}")
    log.info("")

    X, y = load_dataset(args.data_dir)

    if len(X) < 10:
        log.warning("Very few samples! Results may be unreliable.")
        log.warning("Recommended: 50+ samples per class.")
    elif len(X) < 30:
        log.warning("Few samples. Consider adding more data for better results.")

    train_and_evaluate(X, y, args.output, augment=not args.no_augment)


if __name__ == "__main__":
    main()