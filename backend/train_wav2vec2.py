"""
Train Wav2Vec2 model for voice deepfake detection
Usage: python train_wav2vec2.py --data_dir ./data --output ./models/wav2vec2_model
"""

import os
import argparse
import torch
import librosa
import numpy as np
from datasets import Dataset
from transformers import (
    AutoModelForAudioClassification,
    AutoFeatureExtractor,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from pathlib import Path
import json
import warnings
warnings.filterwarnings('ignore')

# ─── Configuration ──────────────────────────────────────────
MODEL_NAME = "garystafford/wav2vec2-deepfake-voice-detector"
SAMPLE_RATE = 16000
MAX_DURATION = 4  # seconds

# ─── Arguments ──────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Train Wav2Vec2 for voice deepfake detection")
parser.add_argument("--data_dir", type=str, default="./data", help="Dataset root with real/ and ai_generated/ subdirs")
parser.add_argument("--output", type=str, default="./models/wav2vec2_model", help="Output directory for trained model")
parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
parser.add_argument("--batch_size", type=int, default=4, help="Batch size")
parser.add_argument("--learning_rate", type=float, default=3e-5, help="Learning rate")
args = parser.parse_args()

print("=" * 60)
print("🎙️  Training Wav2Vec2 Model for Voice Deepfake Detection")
print("=" * 60)
print(f"Data dir: {args.data_dir}")
print(f"Output: {args.output}")
print(f"Epochs: {args.epochs}")
print(f"Batch size: {args.batch_size}")
print(f"Learning rate: {args.learning_rate}")
print()

# ─── Load Dataset ──────────────────────────────────────────
def load_dataset(data_dir):
    """Load audio files and create dataset"""
    data_path = Path(data_dir)
    real_dir = data_path / "real"
    ai_dir = data_path / "ai_generated"
    
    audio_files = []
    labels = []
    
    # Real audio (label = 0)
    if real_dir.exists():
        for f in real_dir.iterdir():
            if f.suffix.lower() in {'.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac'}:
                audio_files.append(str(f))
                labels.append(0)
    
    # AI-generated audio (label = 1)
    if ai_dir.exists():
        for f in ai_dir.iterdir():
            if f.suffix.lower() in {'.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac'}:
                audio_files.append(str(f))
                labels.append(1)
    
    print(f"\nFound {len(audio_files)} audio files")
    print(f"  Real: {labels.count(0)}")
    print(f"  AI: {labels.count(1)}")
    
    return audio_files, labels

# ─── Load Data ─────────────────────────────────────────────
audio_files, labels = load_dataset(args.data_dir)

if len(audio_files) < 10:
    print("❌ Not enough data! Need at least 10 samples.")
    print("   Add more audio files to data/real/ and data/ai_generated/")
    exit(1)

# ─── Split Data ────────────────────────────────────────────
train_files, val_files, train_labels, val_labels = train_test_split(
    audio_files, labels, test_size=0.2, random_state=42, stratify=labels
)

print(f"\nTrain: {len(train_files)} samples")
print(f"Validation: {len(val_files)} samples")

# ─── Create Dataset ────────────────────────────────────────
def prepare_dataset(files, labels):
    """Create dataset with audio paths and labels"""
    data = {
        "file": files,
        "label": labels
    }
    return Dataset.from_dict(data)

train_dataset = prepare_dataset(train_files, train_labels)
val_dataset = prepare_dataset(val_files, val_labels)

# ─── Audio Processing ──────────────────────────────────────
print("\nLoading feature extractor...")
feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)

def preprocess_function(examples):
    """Process audio files for the model"""
    audio_arrays = []
    for file_path in examples["file"]:
        try:
            audio, sr = librosa.load(file_path, sr=SAMPLE_RATE, duration=MAX_DURATION)
            # Pad or truncate to MAX_DURATION
            if len(audio) < SAMPLE_RATE * MAX_DURATION:
                audio = np.pad(audio, (0, SAMPLE_RATE * MAX_DURATION - len(audio)))
            else:
                audio = audio[:SAMPLE_RATE * MAX_DURATION]
            audio_arrays.append(audio)
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            audio_arrays.append(np.zeros(SAMPLE_RATE * MAX_DURATION))
    
    inputs = feature_extractor(
        audio_arrays,
        sampling_rate=SAMPLE_RATE,
        return_tensors="pt",
        padding=True
    )
    inputs["labels"] = examples["label"]
    return inputs

print("Preprocessing training data...")
train_dataset = train_dataset.map(preprocess_function, batched=True, batch_size=args.batch_size)
print("Preprocessing validation data...")
val_dataset = val_dataset.map(preprocess_function, batched=True, batch_size=args.batch_size)

# ─── Model Loading ──────────────────────────────────────────
print("\nLoading model...")
model = AutoModelForAudioClassification.from_pretrained(
    MODEL_NAME,
    num_labels=2,
    label2id={"real": 0, "fake": 1},
    id2label={0: "real", 1: "fake"}
)

# ─── Metrics ────────────────────────────────────────────────
def compute_metrics(eval_pred):
    """Compute evaluation metrics"""
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, predictions),
        "f1": f1_score(labels, predictions, average="weighted"),
        "precision": precision_score(labels, predictions, average="weighted"),
        "recall": recall_score(labels, predictions, average="weighted")
    }

# ─── Training Arguments ────────────────────────────────────
training_args = TrainingArguments(
    output_dir=args.output,
    num_train_epochs=args.epochs,
    per_device_train_batch_size=args.batch_size,
    per_device_eval_batch_size=args.batch_size,
    learning_rate=args.learning_rate,
    warmup_steps=100,
    weight_decay=0.01,
    eval_strategy="epoch",
    save_strategy="epoch",
    logging_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    greater_is_better=True,
    push_to_hub=False,
    report_to="none",
    save_total_limit=2,
    fp16=False,  # CPU doesn't support FP16
)

# ─── Trainer ────────────────────────────────────────────────
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    processing_class=feature_extractor,  # Fixed: changed from tokenizer
    compute_metrics=compute_metrics,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
)

# ─── Train ──────────────────────────────────────────────────
print("\n🚀 Starting training...")
print("=" * 60)
print(f"⚠️  Training on CPU - this will take a while!")
print("   Consider using Google Colab or Kaggle for GPU training.")
print("=" * 60)

trainer.train()

# ─── Save Model ────────────────────────────────────────────
print("\n💾 Saving model...")
os.makedirs(args.output, exist_ok=True)
model.save_pretrained(args.output)
feature_extractor.save_pretrained(args.output)

# Save metrics
metrics = trainer.evaluate()
with open(f"{args.output}/metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print(f"\n✅ Model saved to: {args.output}")
print(f"📊 Metrics: {metrics}")
print("\n🎉 Training complete!")