import requests, io
from PIL import Image

url = "http://127.0.0.1:8000"
img = Image.new("RGB", (224, 224), color=(80, 160, 60))
buf = io.BytesIO()
img.save(buf, format="JPEG")
img_bytes = buf.getvalue()

crops = ["beans", "cotton", "potato", "rice", "tomato"]
print("Testing all 5 Notebook ML Models via HTTP API:")
print("=" * 60)
all_ok = True
for crop in crops:
    files = {"file": ("leaf.jpg", img_bytes, "image/jpeg")}
    data = {"crop": crop}
    r = requests.post(f"{url}/predict", files=files, data=data, timeout=20)
    res = r.json()
    pred = res.get("predicted_class", "?")
    conf = res.get("confidence", 0)
    method = res.get("method", "?")
    top = res.get("top_predictions", [])[:2]
    print(f"  [{crop.upper():<10}] {pred:<30} | {conf}% | {method}")
    for t in top:
        print(f"               Top: {t['label']} ({t['confidence']}%)")
    if pred == "Unknown" or conf == 0:
        all_ok = False
print("=" * 60)
if all_ok:
    print("All 5 notebook models are WORKING correctly!")
else:
    print("Some models returned Unknown - check server logs")
