import os
import shutil
import urllib.request
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRETRAINED_DIR = os.path.join(BASE_DIR, "pretrained_models")

MODELS_TO_DOWNLOAD = {
    "cotton": {
        "dir": os.path.join(PRETRAINED_DIR, "cotton"),
        "files": {
            "best_densenet.pth": "https://huggingface.co/FarmGuard/cotton-densenet121/resolve/main/best_densenet.pth",
            "classes.json": "https://huggingface.co/FarmGuard/cotton-densenet121/resolve/main/classes.json",
        }
    },
    "potato": {
        "dir": os.path.join(PRETRAINED_DIR, "potato"),
        "files": {
            "best.keras": "https://huggingface.co/Adi2912/DenseNet169_PlantVillagePotatoLeaf/resolve/main/best.keras",
        }
    },
    "rice": {
        "dir": os.path.join(PRETRAINED_DIR, "rice"),
        "files": {
            "model.safetensors": "https://huggingface.co/Huyt/rice-leaf-disease-efficientnet-b0/resolve/main/model.safetensors",
            "config.json": "https://huggingface.co/Huyt/rice-leaf-disease-efficientnet-b0/resolve/main/config.json",
        }
    },
    "beans": {
        "dir": os.path.join(PRETRAINED_DIR, "beans"),
        "files": {
            "model.safetensors": "https://huggingface.co/dzinampini/beans-leaf-disease-detection/resolve/main/model.safetensors",
            "config.json": "https://huggingface.co/dzinampini/beans-leaf-disease-detection/resolve/main/config.json",
            "preprocessor_config.json": "https://huggingface.co/dzinampini/beans-leaf-disease-detection/resolve/main/preprocessor_config.json",
        }
    },
    "tomato": {
        "dir": os.path.join(PRETRAINED_DIR, "tomato"),
        "files": {
            "model.safetensors": "https://huggingface.co/wellCh4n/tomato-leaf-disease-classification-vit/resolve/main/model.safetensors",
            "config.json": "https://huggingface.co/wellCh4n/tomato-leaf-disease-classification-vit/resolve/main/config.json",
            "preprocessor_config.json": "https://huggingface.co/wellCh4n/tomato-leaf-disease-classification-vit/resolve/main/preprocessor_config.json",
        }
    }
}

# If cotton was already downloaded to pretrained_models directly, move it
old_cotton = os.path.join(PRETRAINED_DIR, "cotton_best_densenet.pth")
cotton_dir = os.path.join(PRETRAINED_DIR, "cotton")
os.makedirs(cotton_dir, exist_ok=True)
if os.path.exists(old_cotton) and not os.path.exists(os.path.join(cotton_dir, "best_densenet.pth")):
    shutil.move(old_cotton, os.path.join(cotton_dir, "best_densenet.pth"))
    print("[+] Moved existing cotton_best_densenet.pth to cotton/best_densenet.pth")

def download_file(url, target_path):
    if os.path.exists(target_path) and os.path.getsize(target_path) > 0:
        print(f"    Already exists: {os.path.basename(target_path)} ({os.path.getsize(target_path):,} bytes)")
        return
    
    print(f"    Downloading {os.path.basename(target_path)} from {url}...")
    t0 = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": "FarmGenie/1.0"})
    with urllib.request.urlopen(req) as resp, open(target_path, "wb") as out:
        total_size = resp.length or 0
        downloaded = 0
        chunk_size = 1024 * 1024 # 1MB
        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            out.write(chunk)
            downloaded += len(chunk)
            if total_size > 0:
                pct = downloaded * 100 / total_size
                print(f"\r      {downloaded/(1024*1024):.1f}/{total_size/(1024*1024):.1f} MB ({pct:.1f}%)", end="", flush=True)
    print(f"\n    Completed in {time.time() - t0:.1f}s!")

def download_all():
    print("=" * 60)
    print("  Downloading Crop Disease Models for FarmGenie")
    print("=" * 60)
    for crop_name, info in MODELS_TO_DOWNLOAD.items():
        print(f"\n[*] Processing [{crop_name.upper()}] model...")
        os.makedirs(info["dir"], exist_ok=True)
        for fname, url in info["files"].items():
            fpath = os.path.join(info["dir"], fname)
            download_file(url, fpath)
    print("\n[✔] All models downloaded and cached successfully!")

if __name__ == "__main__":
    download_all()
