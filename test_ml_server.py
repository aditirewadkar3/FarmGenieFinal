import os
import sys
import time
import requests
import subprocess
from PIL import Image
import io

print("1. Launching ML server subprocess...")
proc = subprocess.Popen([sys.executable, "app.py"], cwd="ml_projet_models")

server_url = "http://127.0.0.1:8000"

try:
    print("2. Waiting for server to come online...")
    online = False
    for _ in range(30):
        try:
            r = requests.get(f"{server_url}/health", timeout=2)
            data = r.json()
            if data.get("status") == "online":
                print("[+] Server is ONLINE! Health:", data)
                online = True
                break
            else:
                print(f"[*] Server status: {data.get('status')}... waiting")
        except Exception:
            pass
        time.sleep(2)

    if not online:
        print("[-] Server failed to come online in time")
        sys.exit(1)

    print("\n3. Testing Predictions for all 5 crops...")
    # Create test image
    img = Image.new("RGB", (224, 224), color=(80, 160, 60))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    for crop in ["beans", "cotton", "potato", "rice", "tomato"]:
        files = {"file": ("test_leaf.jpg", img_bytes, "image/jpeg")}
        data = {"crop": crop}
        r = requests.post(f"{server_url}/predict", files=files, data=data, timeout=10)
        res = r.json()
        print(f"   [{crop.upper()}] -> Prediction: {res.get('predicted_class')}, Confidence: {res.get('confidence')}%, Method: {res.get('method')}")

    print("\n[✔] All ML server endpoints tested successfully!")

finally:
    print("4. Stopping test server...")
    proc.terminate()
    proc.wait()
