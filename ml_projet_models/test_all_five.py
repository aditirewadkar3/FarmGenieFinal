import os
import torch
from PIL import Image
import numpy as np

dummy_img = Image.new("RGB", (224, 224), color=(100, 180, 80))

print("1. Testing BEANS model...")
try:
    from transformers import AutoImageProcessor, AutoModelForImageClassification
    b_name = "dzinampini/beans-leaf-disease-detection"
    b_proc = AutoImageProcessor.from_pretrained(b_name)
    b_model = AutoModelForImageClassification.from_pretrained(b_name)
    b_model.eval()
    inp = b_proc(images=dummy_img, return_tensors="pt")
    with torch.no_grad():
        out = b_model(**inp)
    probs = torch.softmax(out.logits, dim=-1)[0]
    pred_idx = torch.argmax(probs).item()
    print("   Beans success! Pred:", b_model.config.id2label[pred_idx], f"{probs[pred_idx].item()*100:.2f}%")
except Exception as e:
    print("   Beans failed:", e)

print("2. Testing COTTON model...")
try:
    import json
    import torchvision.models as models
    from torchvision import transforms
    from huggingface_hub import hf_hub_download
    c_repo = "FarmGuard/cotton-densenet121"
    c_weights = hf_hub_download(repo_id=c_repo, filename="best_densenet.pth")
    c_cls = hf_hub_download(repo_id=c_repo, filename="classes.json")
    with open(c_cls, "r") as f:
        cls_data = json.load(f)
    cotton_classes = cls_data if isinstance(cls_data, list) else [cls_data[str(i)] for i in range(len(cls_data))]
    c_model = models.densenet121(weights=None)
    c_model.classifier = torch.nn.Linear(c_model.classifier.in_features, len(cotton_classes))
    ckpt = torch.load(c_weights, map_location="cpu")
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
    pred_idx = torch.argmax(probs).item()
    print("   Cotton success! Pred:", cotton_classes[pred_idx], f"{probs[pred_idx].item()*100:.2f}%")
except Exception as e:
    print("   Cotton failed:", e)

print("3. Testing POTATO model...")
try:
    os.environ["KERAS_BACKEND"] = "tensorflow"
    import keras
    from huggingface_hub import hf_hub_download
    p_repo = "Adi2912/DenseNet169_PlantVillagePotatoLeaf"
    p_path = hf_hub_download(repo_id=p_repo, filename="best.keras")
    p_model = keras.saving.load_model(p_path)
    img_arr = np.expand_dims(np.array(dummy_img.resize((224, 224))) / 255.0, axis=0)
    preds = p_model.predict(img_arr, verbose=0)
    p_classes = ["Early Blight", "Late Blight", "Healthy"]
    pred_idx = np.argmax(preds[0])
    print("   Potato success! Pred:", p_classes[pred_idx], f"{preds[0][pred_idx]*100:.2f}%")
except Exception as e:
    print("   Potato failed:", e)

print("4. Testing RICE model...")
try:
    import timm
    r_model = timm.create_model("hf_hub:Huyt/rice-leaf-disease-efficientnet-b0", pretrained=True)
    r_model.eval()
    cfg = timm.data.resolve_data_config({}, model=r_model)
    tfm = timm.data.create_transform(**cfg)
    inp = tfm(dummy_img).unsqueeze(0)
    with torch.no_grad():
        out = r_model(inp)
    probs = torch.softmax(out, dim=1)[0]
    pred_idx = int(probs.argmax())
    label_names = r_model.pretrained_cfg["label_names"]
    print("   Rice success! Pred:", label_names[pred_idx], f"{float(probs[pred_idx])*100:.2f}%")
except Exception as e:
    print("   Rice failed:", e)

print("5. Testing TOMATO model...")
try:
    from transformers import AutoImageProcessor, AutoModelForImageClassification
    t_name = "wellCh4n/tomato-leaf-disease-classification-vit"
    t_proc = AutoImageProcessor.from_pretrained(t_name)
    t_model = AutoModelForImageClassification.from_pretrained(t_name)
    t_model.eval()
    inp = t_proc(images=dummy_img, return_tensors="pt")
    with torch.no_grad():
        out = t_model(**inp)
    probs = torch.softmax(out.logits, dim=-1)[0]
    pred_idx = torch.argmax(probs).item()
    print("   Tomato success! Pred:", t_model.config.id2label[pred_idx], f"{probs[pred_idx].item()*100:.2f}%")
except Exception as e:
    print("   Tomato failed:", e)
