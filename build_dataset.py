import requests
import pandas as pd
import random

# -----------------------------
# Sources
# -----------------------------
OISD_URL = "https://big.oisd.nl/domainswild"   # Blocklist (ads/trackers)
TRANCO_URL = "https://tranco-list.eu/top-1m.csv.zip"  # Allowed (top domains)

# -----------------------------
# Download Blocklist (OISD)
# -----------------------------
print("📥 Downloading OISD blocklist...")
resp = requests.get(OISD_URL, timeout=60)
resp.raise_for_status()
blocked_domains = [line.strip() for line in resp.text.splitlines() if line and not line.startswith("#")]

print(f"✅ Got {len(blocked_domains)} blocked domains")

# -----------------------------
# Download Tranco Top Domains
# -----------------------------
print("📥 Downloading Tranco top domains...")
resp = requests.get(TRANCO_URL, timeout=60)
resp.raise_for_status()

# Tranco file is zipped CSV: rank, domain
import io, zipfile
zf = zipfile.ZipFile(io.BytesIO(resp.content))
csv_name = zf.namelist()[0]
df_tranco = pd.read_csv(zf.open(csv_name), header=None, names=["rank", "domain"])

allowed_domains = df_tranco["domain"].head(50000).tolist()  # take top 50k
print(f"✅ Got {len(allowed_domains)} allowed domains")

# -----------------------------
# Balance Dataset
# -----------------------------
N = min(len(blocked_domains), len(allowed_domains))

dataset = []
for d in random.sample(blocked_domains, N):
    dataset.append([d, 1])  # 1 = blocked
for d in random.sample(allowed_domains, N):
    dataset.append([d, 0])  # 0 = allowed

random.shuffle(dataset)

df = pd.DataFrame(dataset, columns=["domain", "blocked"])
df.to_csv("dataset.csv", index=False)

print("🎉 Dataset built successfully! Saved as dataset.csv")
print(df.head(10))
