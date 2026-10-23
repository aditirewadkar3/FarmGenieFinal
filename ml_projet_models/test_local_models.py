import os
import json
import torch
from PIL import Image
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRETRAINED_DIR = os.path.join(BASE_DIR, "pretrained_models")
dummy_img = Image.new("RGB", (224, 224), color=(120, 180, 70))

print("1. Testing Local BEANS...")
try:
    from transformers import AutoImageProcessor, AutoModelForImageClassification
    b_dir = os.path.join(PRETRAINED_DIR, "beans")
    proc = AutoImageProcessor.from_pretrained(b_dir)
    model = AutoModelForImageClassification.from_pretrained(b_dir)
    model.eval()
    inp = proc(images=dummy_img, return_tensors="pt")
    with torch.no_grad():
        out = model(**inp)
    probs = torch.softmax(out.logits, dim=-1)[0]
    idx = torch.argmax(probs).item()
    print("   Beans OK! Label:", model.config.id2label[idx], f"{probs[idx].item()*100:.2f}%")
except Exception as e:
    print("   Beans Error:", e)

print("2. Testing Local COTTON...")
try:
    import torchvision.models as models
    from torchvision import transforms
    c_dir = os.path.join(PRETRAINED_DIR, "cotton")
    with open(os.path.join(c_dir, "classes.json"), "r") as f:
        c_classes = json.load(f)
    if isinstance(c_classes, dict):
        c_classes = [c_classes[str(i)] for i in range(len(c_classes))]
    c_model = models.densenet121(weights=None)
    c_model.classifier = torch.nn.Linear(c_model.classifier.in_features, len(c_classes))
    ckpt = torch.load(os.path.join(c_dir, "best_densenet.pth"), map_location="cpu")
    st = ckpt.get("model_state_dict", ckpt.get("state_dict", ckpt)) if isinstance(ckpt, dict) else ckpt
    c_model.load_state_dict({k.replace("module.", ""): v for k, v in st.items()})
    c_model.eval()
    tfm = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225))
    ])
    inp = tfm(dummy_img).unsqueeze(0)
    with torch.no_grad():
        out = c_model(inp)
    probs = torch.softmax(out, dim=1)[0]
    idx = torch.argmax(probs).item()
    print("   Cotton OK! Label:", c_classes[idx], f"{probs[idx].item()*100:.2f}%")
except Exception as e:
    print("   Cotton Error:", e)

print("3. Testing Local POTATO...")
try:
    os.environ["KERAS_BACKEND"] = "tensorflow"
    import keras
    p_path = os.path.join(PRETRAINED_DIR, "potato", "best.keras")
    p_model = keras.saving.load_model(p_path)
    img_arr = np.expand_dims(np.array(dummy_img.resize((224, 224))) / 255.0, axis=0)
    preds = p_model.predict(img_arr, verbose=0)
    p_classes = ["Early Blight", "Late Blight", "Healthy"]
    idx = np.argmax(preds[0])
    print("   Potato OK! Label:", p_classes[idx], f"{preds[0][idx]*100:.2f}%")
except Exception as e:
    print("   Potato Error:", e)

print("4. Testing Local RICE...")
try:
    import timm
    from safetensors.torch import load_file
    r_dir = os.path.join(PRETRAINED_DIR, "rice")
    with open(os.path.join(r_dir, "config.json"), "r") as f:
        r_cfg = json.load(f)
    r_labels = r_cfg.get("label_names", [])
    num_classes = len(r_labels) if r_labels else 10
    r_model = timm.create_model("efficientnet_b0", num_classes=num_classes, pretrained=False)
    st = load_file(os.path.join(r_dir, "model.safetensors"))
    r_model.load_state_dict(st)
    r_model.eval()
    cfg = timm.data.resolve_data_config({}, model=r_model)
    tfm = timm.data.create_transform(**cfg)
    inp = tfm(dummy_img).unsqueeze(0)
    with torch.no_grad():
        out = r_model(inp)
    probs = torch.softmax(out, dim=1)[0]
    idx = int(probs.argmax())
    label = r_labels[idx] if idx < len(r_labels) else f"Class_{idx}"
    print("   Rice OK! Label:", label, f"{float(probs[idx])*100:.2f}%")
except Exception as e:
    print("   Rice Error:", e)

print("5. Testing Local TOMATO...")
try:
    from transformers import AutoImageProcessor, AutoModelForImageClassification
    t_dir = os.path.join(PRETRAINED_DIR, "tomato")
    proc = AutoImageProcessor.from_pretrained(t_dir)
    model = AutoModelForImageClassification.from_pretrained(t_dir)
    model.eval()
    inp = proc(images=dummy_img, return_tensors="pt")
    with torch.no_grad():
        out = model(**inp)
    probs = torch.softmax(out.logits, dim=-1)[0]
    idx = torch.argmax(probs).item()
    print("   Tomato OK! Label:", model.config.id2label[idx], f"{probs[idx].item()*100:.2f}%")
except Exception as e:
    print("   Tomato Error:", e)
