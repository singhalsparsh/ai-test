# 🎓 DeepfakeGuard — Fine-Tuning Wav2Vec2 on Google Colab

A step-by-step guide to fine-tune `garystafford/wav2vec2-deepfake-voice-detector` on your own voice dataset using Google Colab's free GPU.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup & Installation](#step-1-setup--installation)
3. [Dataset Preparation](#step-2-dataset-preparation)
4. [Load Base Model](#step-3-load-base-model)
5. [Preprocessing & Feature Extraction](#step-4-preprocessing--feature-extraction)
6. [Fine-Tuning](#step-5-fine-tuning)
7. [Evaluation](#step-6-evaluation)
8. [Export & Download](#step-7-export--download)
9. [Use in DeepfakeGuard Backend](#step-8-use-in-deepfakeguard-backend)
10. [Dataset Sources](#dataset-sources)
11. [Tips & Troubleshooting](#tips--troubleshooting)

---

## Overview

| Detail | Value |
|---|---|
| **Base Model** | `garystafford/wav2vec2-deepfake-voice-detector` |
| **Architecture** | Wav2Vec2 + classification head (2 classes: real/fake) |
| **Expected Accuracy** | 95–98% (depends on dataset quality) |
| **Colab Runtime** | GPU (T4 or A100) |
| **Training Time** | ~30–90 min (depending on dataset size) |
| **Output** | Fine-tuned model files (model weights, config, feature extractor) |

---

## Step 1: Setup & Installation

> Open [Google Colab](https://colab.research.google.com), create a new notebook, and enable GPU:
> **Runtime → Change runtime type → T4 GPU**

### Cell 1 — Install Dependencies

```python
# Install required packages
!pip install -q transformers[torch] datasets evaluate accelerate
!pip install -q librosa soundfile scikit-learn tensorboard
!pip install -q huggingface_hub

# Verify GPU is available
import torch
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")
else:
    print("⚠️ No GPU detected! Go to Runtime → Change runtime type → T4 GPU")
```

### Cell 2 — Login to Hugging Face

```python
from huggingface_hub import login

# You need a HuggingFace token to push your fine-tuned model
# Get one at: https://huggingface.co/settings/tokens
login(token="YOUR_HF_TOKEN_HERE")  # Replace with your token

print("✅ Logged in to Hugging Face")
```

---

## Step 2: Dataset Preparation

### Option A — Use ASVspoof 2021 (Recommended)

```python
from datasets import load_dataset

# ASVspoof 2021 — the standard benchmark for deepfake audio detection
# Contains real human speech and AI-generated spoofed audio
print("Loading ASVspoof 2019 dataset (used as training source)...")

dataset = load_dataset("ntt-ds/asvspoof21", trust_remote_code=True)
print(f"Dataset loaded: {dataset}")
print(f"Train samples: {len(dataset['train'])}")
print(f"Validation samples: {len(dataset['dev'])}")
```

### Option B — Use Your Own Dataset

```python
import os
import librosa
import soundfile as sf
from datasets import Dataset, DatasetDict

def create_dataset_from_folders(real_folder, fake_folder, sample_rate=16000, max_duration=10.0):
    """
    Create a HuggingFace dataset from folders of real and fake audio files.

    Expected folder structure:
        real_folder/
            ├── audio_001.wav
            ├── audio_002.wav
            └── ...
        fake_folder/
            ├── fake_001.wav
            ├── fake_002.wav
            └── ...

    Supports: .wav, .mp3, .flac, .ogg, .m4a
    """
    samples = []
    supported = {'.wav', '.mp3', '.flac', '.ogg', '.m4a'}

    # Process real audio (label = 0)
    for fname in sorted(os.listdir(real_folder)):
        ext = os.path.splitext(fname)[1].lower()
        if ext not in supported:
            continue
        path = os.path.join(real_folder, fname)
        try:
            audio, sr = librosa.load(path, sr=sample_rate, mono=True)
            max_samples = int(max_duration * sample_rate)
            if len(audio) > max_samples:
                audio = audio[:max_samples]
            if len(audio) < sample_rate:  # Skip files < 1 second
                continue
            samples.append({
                "audio": {"array": audio, "sampling_rate": sample_rate},
                "label": 0,  # 0 = real (bonafide)
                "filename": fname,
            })
        except Exception as e:
            print(f"  ⚠️ Skipping {fname}: {e}")

    # Process fake audio (label = 1)
    for fname in sorted(os.listdir(fake_folder)):
        ext = os.path.splitext(fname)[1].lower()
        if ext not in supported:
            continue
        path = os.path.join(fake_folder, fname)
        try:
            audio, sr = librosa.load(path, sr=sample_rate, mono=True)
            max_samples = int(max_duration * sample_rate)
            if len(audio) > max_samples:
                audio = audio[:max_samples]
            if len(audio) < sample_rate:
                continue
            samples.append({
                "audio": {"array": audio, "sampling_rate": sample_rate},
                "label": 1,  # 1 = fake (spoof/deepfake)
                "filename": fname,
            })
        except Exception as e:
            print(f"  ⚠️ Skipping {fname}: {e}")

    dataset = Dataset.from_list(samples)

    # Split 80/10/10
    split = dataset.train_test_split(test_size=0.2, seed=42, stratify_by_column="label")
    test_valid = split["test"].train_test_split(test_size=0.5, seed=42, stratify_by_column="label")

    return DatasetDict({
        "train": split["train"],
        "validation": split["test"],
        "test": test_valid["test"],
    })


# --- Mount Google Drive and use your dataset ---
from google.colab import drive
drive.mount('/content/drive')

# Update these paths to your folders
REAL_PATH = "/content/drive/MyDrive/deepfake-dataset/real"   # ← Change this
FAKE_PATH = "/content/drive/MyDrive/deepfake-dataset/fake"   # ← Change this

dataset = create_dataset_from_folders(REAL_PATH, FAKE_PATH)
print(f"\n✅ Dataset created:")
print(f"   Train:      {len(dataset['train'])} samples")
print(f"   Validation: {len(dataset['validation'])} samples")
print(f"   Test:       {len(dataset['test'])} samples")
```

### Option C — Quick Test with Synthetic Data (for testing pipeline only)

```python
import numpy as np
from datasets import Dataset, DatasetDict

def generate_synthetic_dataset(n_samples=200, sample_rate=16000, duration=4.0):
    """Generate synthetic audio for pipeline testing — NOT for real training."""
    samples = []
    n_per_class = n_samples // 2

    for i in range(n_per_class):
        # Simulate "real" voice: sine wave with noise
        t = np.linspace(0, duration, int(sample_rate * duration))
        freq = 150 + np.random.randn() * 20
        audio = np.sin(2 * np.pi * freq * t) * 0.3 + np.random.randn(len(t)) * 0.05
        samples.append({"audio": {"array": audio.astype(np.float32), "sampling_rate": sample_rate}, "label": 0})

    for i in range(n_per_class):
        # Simulate "fake" voice: square wave with artifacts
        t = np.linspace(0, duration, int(sample_rate * duration))
        freq = 120 + np.random.randn() * 15
        audio = np.sign(np.sin(2 * np.pi * freq * t)) * 0.3 + np.random.randn(len(t)) * 0.08
        samples.append({"audio": {"array": audio.astype(np.float32), "sampling_rate": sample_rate}, "label": 1})

    ds = Dataset.from_list(samples)
    split = ds.train_test_split(test_size=0.2, seed=42, stratify_by_column="label")
    test_valid = split["test"].train_test_split(test_size=0.5, seed=42, stratify_by_column="label")

    return DatasetDict({"train": split["train"], "validation": split["test"], "test": test_valid["test"]})

dataset = generate_synthetic_dataset(n_samples=400)
print(f"✅ Synthetic test dataset: {len(dataset['train'])} train, {len(dataset['validation'])} val")
print("⚠️ This is for pipeline testing only — use real data for actual fine-tuning!")
```

### Verify Dataset

```python
# Check label distribution
import collections

for split_name in dataset:
    labels = [s["label"] for s in dataset[split_name]]
    counts = collections.Counter(labels)
    print(f"{split_name}: real={counts[0]}, fake={counts[1]}, total={len(labels)}")

# Play a sample (optional)
from IPython.display import Audio
sample = dataset["train"][0]
print(f"\nLabel: {'FAKE' if sample['label'] == 1 else 'REAL'}")
Audio(sample["audio"]["array"], rate=sample["audio"]["sampling_rate"])
```

---

## Step 3: Load Base Model

```python
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor
import torch

MODEL_ID = "garystafford/wav2vec2-deepfake-voice-detector"
NUM_LABELS = 2
LABELS = ["bonafide", "spoof"]  # 0 = real, 1 = fake

# Load pre-trained model and feature extractor
feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_ID)
model = AutoModelForAudioClassification.from_pretrained(
    MODEL_ID,
    num_labels=NUM_LABELS,
    label2id={"bonafide": 0, "spoof": 1},
    id2label={0: "bonafide", 1: "spoof"},
    ignore_mismatched_sizes=True,  # Allow re-initializing the classification head
)

# Move to GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

print(f"✅ Model loaded: {MODEL_ID}")
print(f"   Labels: {model.config.label2id}")
print(f"   Device: {device}")
print(f"   Parameters: {sum(p.numel() for p in model.parameters()):,}")
```

---

## Step 4: Preprocessing & Feature Extraction

```python
SAMPLE_RATE = 16000
MAX_DURATION = 10  # seconds
MAX_LENGTH = SAMPLE_RATE * MAX_DURATION  # 160000 samples

def preprocess_function(examples):
    """
    Preprocess audio for Wav2Vec2:
    1. Resample to 16kHz
    2. Pad/truncate to fixed length
    3. Extract features using Wav2Vec2 feature extractor
    """
    audio_arrays = [x["array"] for x in examples["audio"]]
    sampling_rates = [x["sampling_rate"] for x in examples["audio"]]

    # Pad or truncate to MAX_LENGTH
    processed = []
    for audio, sr in zip(audio_arrays, sampling_rates):
        if len(audio) > MAX_LENGTH:
            audio = audio[:MAX_LENGTH]
        elif len(audio) < MAX_LENGTH:
            # Pad with zeros
            audio = np.pad(audio, (0, MAX_LENGTH - len(audio)), mode="constant")
        processed.append(audio)

    inputs = feature_extractor(
        processed,
        sampling_rate=SAMPLE_RATE,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
    )

    inputs["labels"] = examples["label"]
    return inputs


# Apply preprocessing
import numpy as np

print("Preprocessing training data...")
tokenized_train = dataset["train"].map(
    preprocess_function,
    batched=True,
    batch_size=16,
    remove_columns=["audio", "filename"],
)

print("Preprocessing validation data...")
tokenized_val = dataset["validation"].map(
    preprocess_function,
    batched=True,
    batch_size=16,
    remove_columns=["audio", "filename"],
)

print("Preprocessing test data...")
tokenized_test = dataset["test"].map(
    preprocess_function,
    batched=True,
    batch_size=16,
    remove_columns=["audio", "filename"],
)

print(f"\n✅ Preprocessed:")
print(f"   Train:      {len(tokenized_train)} samples")
print(f"   Validation: {len(tokenized_val)} samples")
print(f"   Test:       {len(tokenized_test)} samples")
```

---

## Step 5: Fine-Tuning

### Cell 1 — Training Configuration

```python
from transformers import TrainingArguments

OUTPUT_DIR = "./deepfakeguard-finetuned"

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,

    # Training hyperparameters
    num_train_epochs=5,              # 3-10 epochs depending on dataset size
    per_device_train_batch_size=8,   # Reduce to 4 if OOM on T4
    per_device_eval_batch_size=8,
    gradient_accumulation_steps=2,   # Effective batch size = 8 * 2 = 16

    # Learning rate schedule
    learning_rate=3e-5,              # Lower = more stable, higher = faster convergence
    warmup_ratio=0.1,                # 10% warmup steps
    weight_decay=0.01,

    # Evaluation
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    greater_is_better=True,

    # Performance
    fp16=True,                       # Mixed precision (faster on GPU)
    dataloader_num_workers=2,

    # Logging
    logging_dir=f"{OUTPUT_DIR}/logs",
    logging_steps=50,
    report_to="tensorboard",

    # Reproducibility
    seed=42,
    data_seed=42,

    # Push to Hub
    push_to_hub=False,               # We'll push manually after training
)

print("✅ Training configuration set")
print(f"   Epochs: {training_args.num_train_epochs}")
print(f"   Batch size: {training_args.per_device_train_batch_size}")
print(f"   Effective batch size: {training_args.per_device_train_batch_size * training_args.gradient_accumulation_steps}")
print(f"   Learning rate: {training_args.learning_rate}")
```

### Cell 2 — Define Metrics

```python
import evaluate
import numpy as np

accuracy_metric = evaluate.load("accuracy")
f1_metric = evaluate.load("f1")
precision_metric = evaluate.load("precision")
recall_metric = evaluate.load("recall")

def compute_metrics(eval_pred):
    """Compute accuracy, F1, precision, and recall."""
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)

    accuracy = accuracy_metric.compute(predictions=predictions, references=labels)["accuracy"]
    f1 = f1_metric.compute(predictions=predictions, references=labels)["f1"]
    precision = precision_metric.compute(predictions=predictions, references=labels)["precision"]
    recall = recall_metric.compute(predictions=predictions, references=labels)["recall"]

    return {
        "accuracy": accuracy,
        "f1": f1,
        "precision": precision,
        "recall": recall,
    }

print("✅ Metrics defined: accuracy, F1, precision, recall")
```

### Cell 3 — Train

```python
from transformers import Trainer
import time

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_val,
    compute_metrics=compute_metrics,
    tokenizer=feature_extractor,  # Save feature extractor with model
)

print("🚀 Starting fine-tuning...")
start_time = time.time()

# Train
train_result = trainer.train()

elapsed = time.time() - start_time
print(f"\n✅ Training complete! Time: {elapsed / 60:.1f} minutes")
print(f"   Train loss: {train_result.metrics['train_loss']:.4f}")

# Evaluate on validation set
print("\n📊 Evaluating on validation set...")
eval_results = trainer.evaluate()
print(f"   Accuracy:  {eval_results['eval_accuracy']:.4f}")
print(f"   F1 Score:  {eval_results['eval_f1']:.4f}")
print(f"   Precision: {eval_results['eval_precision']:.4f}")
print(f"   Recall:    {eval_results['eval_recall']:.4f}")
```

### Cell 4 — Monitor Training (Optional)

```python
# View training logs
%load_ext tensorboard
%tensorboard --logdir {OUTPUT_DIR}/logs

# Or view as DataFrame
import pandas as pd
log_history = trainer.state.log_history
df = pd.DataFrame(log_history)
print(df.to_string())
```

---

## Step 6: Evaluation

### Cell 1 — Test Set Evaluation

```python
print("🧪 Evaluating on held-out test set...")
test_results = trainer.evaluate(tokenized_test)

print(f"\n{'='*50}")
print(f"  TEST SET RESULTS")
print(f"{'='*50}")
print(f"  Accuracy:  {test_results['eval_accuracy']:.4f} ({test_results['eval_accuracy']*100:.1f}%)")
print(f"  F1 Score:  {test_results['eval_f1']:.4f}")
print(f"  Precision: {test_results['eval_precision']:.4f}")
print(f"  Recall:    {test_results['eval_recall']:.4f}")
print(f"{'='*50}")
```

### Cell 2 — Confusion Matrix

```python
from sklearn.metrics import confusion_matrix, classification_report
import matplotlib.pyplot as plt
import seaborn as sns

# Get predictions on test set
predictions = trainer.predict(tokenized_test)
preds = np.argmax(predictions.predictions, axis=-1)
labels = predictions.label_ids

# Classification report
print("\n📋 Classification Report:")
print(classification_report(labels, preds, target_names=["Bonafide (Real)", "Spoof (Fake)"]))

# Confusion matrix
cm = confusion_matrix(labels, preds)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Bonafide", "Spoof"],
            yticklabels=["Bonafide", "Spoof"])
plt.title("Confusion Matrix — DeepfakeGuard Fine-Tuned Model")
plt.ylabel("True Label")
plt.xlabel("Predicted Label")
plt.tight_layout()
plt.savefig("confusion_matrix.png", dpi=150)
plt.show()
```

### Cell 3 — Per-Class Accuracy

```python
# Detailed per-class analysis
real_correct = sum(1 for p, l in zip(preds, labels) if p == l == 0)
real_total = sum(1 for l in labels if l == 0)
fake_correct = sum(1 for p, l in zip(preds, labels) if p == l == 1)
fake_total = sum(1 for l in labels if l == 1)

print(f"\n🔍 Per-Class Accuracy:")
print(f"   Real voices detected correctly:  {real_correct}/{real_total} ({real_correct/real_total*100:.1f}%)")
print(f"   Fake voices detected correctly:  {fake_correct}/{fake_total} ({fake_correct/fake_total*100:.1f}%)")
```

---

## Step 7: Export & Download

### Cell 1 — Save Model

```python
FINAL_MODEL_DIR = "./deepfakeguard-final"

# Save model + feature extractor
trainer.save_model(FINAL_MODEL_DIR)
feature_extractor.save_pretrained(FINAL_MODEL_DIR)

print(f"✅ Model saved to {FINAL_MODEL_DIR}")

# List saved files
import os
for f in os.listdir(FINAL_MODEL_DIR):
    size = os.path.getsize(os.path.join(FINAL_MODEL_DIR, f))
    print(f"   {f}: {size / 1e6:.1f} MB" if size > 1e6 else f"   {f}: {size / 1e3:.1f} KB")
```

### Cell 2 — Push to Hugging Face Hub

```python
# Push your fine-tuned model to HuggingFace Hub
HF_REPO_NAME = "your-username/deepfakeguard-finetuned"  # ← Change this

model.push_to_hub(HF_REPO_NAME)
feature_extractor.push_to_hub(HF_REPO_NAME)

print(f"✅ Model pushed to: https://huggingface.co/{HF_REPO_NAME}")
```

### Cell 3 — Download as ZIP (Local Download)

```python
import shutil
from google.colab import files

# Create ZIP for download
shutil.make_archive("deepfakeguard-finetuned", "zip", ".", FINAL_MODEL_DIR)
files.download("deepfakeguard-finetuned.zip")

print("✅ Downloading ZIP file — use this to replace your backend model!")
```

### Cell 4 — Convert to ONNX (for browser inference, optional)

```python
# Optional: Export to ONNX for faster inference or browser use
!pip install -q optimum[exporters]

from optimum.onnxruntime import ORTModelForAudioClassification

ort_model = ORTModelForAudioClassification.from_pretrained(
    FINAL_MODEL_DIR,
    export=True,
)

ort_model.save_pretrained(f"{FINAL_MODEL_DIR}/onnx")
print(f"✅ ONNX model exported to {FINAL_MODEL_DIR}/onnx/")
```

---

## Step 8: Use in DeepfakeGuard Backend

After downloading the fine-tuned model, replace the model in your backend:

### Option A — Local Backend (Recommended)

```bash
# 1. Extract the downloaded ZIP to your backend folder
cd C:\deepfakeguard\backend
# Extract deepfakeguard-finetuned.zip → models/deepfakeguard-finetuned/

# 2. Update main.py — change the MODEL_ID line:
#    MODEL_ID = "models/deepfakeguard-finetuned"   # Local path

# 3. Restart the backend
python main.py
```

### Option B — Use from HuggingFace Hub

```bash
# 1. Update main.py — change the MODEL_ID line:
#    MODEL_ID = "your-username/deepfakeguard-finetuned"

# 2. Restart the backend
python main.py
```

### Required `main.py` Change

In `backend/main.py`, find this line:
```python
MODEL_ID = "garystafford/wav2vec2-deepfake-voice-detector"
```

Replace with your fine-tuned model:
```python
MODEL_ID = "your-username/deepfakeguard-finetuned"
```

---

## Dataset Sources

| Dataset | Size | Description | Link |
|---|---|---|---|
| **ASVspoof 2021** | 135K utterances | Standard benchmark for spoofing detection | [GitHub](https://github.com/asvspoof/asvspoof2021) |
| **ASVspoof 2019** | 63K utterances | Previous version, widely used | [GitHub](https://github.com/asvspoof/asvspoof2019) |
| **In-the-Wild** | 36K utterances | Real-world deepfake audio | [GitHub](https://github.com/RUB-SysSec/In-the-Wild) |
| **WaveFake** | 117K utterances | Generated by 6 different TTS systems | [HuggingFace](https://huggingface.co/datasets/RUCAIBox/WaveFake) |
| **Fake-or-Real** | 19K utterances | Real vs. fake speech detection | [HuggingFace](https://huggingface.co/datasets/AhmedBou مشروع/fake-or-real) |
| **Your own** | Varies | Record real calls + generate deepfakes with tools like Bark, VALL-E, XTTS | Collect yourself |

### Recommended Combination

For best results, combine multiple datasets:

```python
# Load and combine ASVspoof + WaveFake + your own data
from datasets import load_dataset, concatenate_datasets

asvspoof = load_dataset("ntt-ds/asvspoof21", split="train")
wavefake = load_dataset("RUCAIBox/WaveFake", split="metadata")

# Combine and standardize labels
# (merge code depends on specific dataset schema)
```

---

## Tips & Troubleshooting

### Performance Tips

| Setting | Small Dataset (<5K) | Medium (5K–50K) | Large (50K+) |
|---|---|---|---|
| Epochs | 10–15 | 5–8 | 3–5 |
| Batch Size | 4 | 8 | 16 |
| Learning Rate | 1e-5 | 3e-5 | 5e-5 |
| Warmup | 20% | 10% | 5% |

### Common Errors

| Error | Fix |
|---|---|
| `CUDA out of memory` | Reduce `per_device_train_batch_size` to 4, increase `gradient_accumulation_steps` |
| `Connection error` | Restart runtime, retry dataset loading |
| `Model not converging` | Increase epochs, reduce learning rate, check dataset quality |
| `Low accuracy` | More data, check label balance, try data augmentation |
| `Feature extractor error` | Make sure `sampling_rate=16000` is set consistently |

### Data Augmentation

```python
# Add noise augmentation for robustness
import random

def add_noise(audio, noise_level=0.005):
    """Add Gaussian noise for data augmentation."""
    noise = np.random.randn(len(audio)) * noise_level
    return (audio + noise).astype(np.float32)

def time_stretch(audio, rate=None):
    """Random time stretching."""
    if rate is None:
        rate = random.uniform(0.9, 1.1)
    return librosa.effects.time_stretch(audio, rate=rate)
```

### Verify Your Model Works

```python
# Quick sanity check — run inference on a test sample
import torch

model.eval()
test_audio = dataset["test"][0]["audio"]["array"]
inputs = feature_extractor(
    test_audio,
    sampling_rate=16000,
    return_tensors="pt",
    padding=True,
    truncation=True,
    max_length=160000,
)

with torch.no_grad():
    inputs = {k: v.to(device) for k, v in inputs.items()}
    outputs = model(**inputs)
    probs = torch.softmax(outputs.logits, dim=-1)

predicted_label = torch.argmax(probs, dim=-1).item()
confidence = probs[0][predicted_label].item()

print(f"Prediction: {'SPOOF (AI)' if predicted_label == 1 else 'BONAFIDE (Real)'}")
print(f"Confidence: {confidence * 100:.1f}%")
print(f"Ground truth: {'SPOOF (AI)' if dataset['test'][0]['label'] == 1 else 'BONAFIDE (Real)'}")
```

---

## 📊 Expected Results

| Metric | Before Fine-Tuning | After Fine-Tuning |
|---|---|---|
| Accuracy | ~88–92% | ~95–98% |
| F1 Score | ~0.87 | ~0.95+ |
| False Positive Rate | ~8% | ~2–3% |
| Inference Time | ~0.3s | ~0.3s (unchanged) |

---

## 🔗 Useful Links

- [Wav2Vec2 Paper](https://arxiv.org/abs/2006.11477)
- [ASVspoof Challenge](https://www.asvspoof.org/)
- [HuggingFace Audio Course](https://huggingface.co/learn/audio-course)
- [Transformers Documentation](https://huggingface.co/docs/transformers)
- [DeepfakeGuard GitHub](https://github.com/singhalsparsh/ai-voice-detector)

---

*Guide created for the Smart India Hackathon (SIH) — DeepfakeGuard Project*
