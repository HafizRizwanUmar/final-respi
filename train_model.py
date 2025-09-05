import os
import re
import random
import pandas as pd
import tensorflow as tf
import tensorflowjs as tfjs

DATASET_FILE = "dataset.csv"

# -----------------------------
# Load Dataset
# -----------------------------
if os.path.exists(DATASET_FILE):
    print(f"📂 Found {DATASET_FILE}, using real dataset...")
    df = pd.read_csv(DATASET_FILE)
else:
    print("⚠️ No dataset.csv found, generating dummy dataset...")

    ad_domains = [
        "ads.google.com", "trackers.example.net", "banner.adserver.com",
        "promo.clickhub.xyz", "metrics.data.net", "beacon.analytics.com",
        "doubleclick.net", "telemetry.apple.fake", "stats.tracker.org"
    ]

    normal_domains = [
        "google.com", "wikipedia.org", "github.com",
        "youtube.com", "nytimes.com", "stackoverflow.com",
        "microsoft.com", "amazon.com", "openai.com"
    ]

    data = []
    for _ in range(500):
        if random.random() > 0.5:
            d = random.choice(ad_domains)
            data.append([d, 1])  # blocked
        else:
            d = random.choice(normal_domains)
            data.append([d, 0])  # allowed

    df = pd.DataFrame(data, columns=["domain", "blocked"])
    df.to_csv(DATASET_FILE, index=False)
    print(f"✅ Dummy dataset saved as {DATASET_FILE}")

print(f"✅ Loaded {len(df)} rows for training")

# -----------------------------
# Feature Extraction
# -----------------------------
def extract_features(domain):
    d = str(domain).lower()
    length = len(d)
    subdomains = d.count(".") + 1
    has_numbers = 1 if re.search(r"\d{2,}", d) else 0
    keyword_hit = sum(
        1 for k in ["ads", "track", "metrics", "click", "banner", "promo", "beacon", "telemetry", "doubleclick"]
        if k in d
    )
    tld = d.split(".")[-1] if "." in d else ""
    tld_type = 1 if tld in ["xyz", "click", "info", "top"] else 0
    return [length, subdomains, has_numbers, keyword_hit, tld_type]

X = df["domain"].apply(extract_features).tolist()
y = df["blocked"].tolist()

X = tf.convert_to_tensor(X, dtype=tf.float32)
y = tf.convert_to_tensor(y, dtype=tf.float32)

# Normalize features
X = X / tf.reduce_max(X, axis=0)

# -----------------------------
# Build & Train Model
# -----------------------------
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(5,)),
    tf.keras.layers.Dense(32, activation="relu"),
    tf.keras.layers.Dense(16, activation="relu"),
    tf.keras.layers.Dense(1, activation="sigmoid")
])

model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

print("🚀 Training model...")
model.fit(X, y, epochs=15, batch_size=16, validation_split=0.2, verbose=1)

# -----------------------------
# Save Model for TF.js
# -----------------------------
os.makedirs("ml_model", exist_ok=True)
tfjs.converters.save_keras_model(model, "ml_model")

print("🎉 Model trained & exported to ml_model/ (ready for React frontend)")
