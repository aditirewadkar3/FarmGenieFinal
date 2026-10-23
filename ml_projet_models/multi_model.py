import os
import json
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import numpy as np

# Maps user-friendly crop names (lowercase) to their PlantVillage class name prefixes.
CROP_CLASS_MAP = {
    "corn": "corn_(maize)",
    "maize": "corn_(maize)",
    "pepper": "pepper,_bell",
    "bell pepper": "pepper,_bell",
    "cherry": "cherry_(including_sour)",
}

class MultiModelEnsemble:
    def __init__(self, yolo_path=None, eff_path=None, mob_path=None, class_names_path=None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.pretrained_dir = os.path.join(self.base_dir, "pretrained_models")
        
        # Specialist models from Jupyter notebooks
        self.beans_model = None
        self.beans_proc = None
        
        self.cotton_model = None
        self.cotton_classes = []
        self.cotton_tfm = None
        
        self.potato_model = None
        self.potato_classes = ["Early Blight", "Late Blight", "Healthy"]
        
        self.rice_model = None
        self.rice_labels = []
        self.rice_tfm = None
        
        self.tomato_model = None
        self.tomato_proc = None
        
        # Legacy / general ensemble models (optional)
        self.yolo_path = yolo_path
        self.eff_path = eff_path
        self.mob_path = mob_path
        self.class_names_path = class_names_path
        self.yolo_model = None
        self.eff_model = None
        self.mob_model = None
        self.class_names = []
        
        self.load_all()

    def load_beans(self):
        beans_dir = os.path.join(self.pretrained_dir, "beans")
        if os.path.isdir(beans_dir):
            try:
                from transformers import AutoImageProcessor, AutoModelForImageClassification
                self.beans_proc = AutoImageProcessor.from_pretrained(beans_dir)
                self.beans_model = AutoModelForImageClassification.from_pretrained(beans_dir)
                self.beans_model.to(self.device)
                self.beans_model.eval()
                print("[+] Loaded Beans Model (ViT) successfully.")
            except Exception as e:
                print(f"[-] Beans Model load error: {e}")

    def load_cotton(self):
        cotton_dir = os.path.join(self.pretrained_dir, "cotton")
        weights_path = os.path.join(cotton_dir, "best_densenet.pth")
        classes_path = os.path.join(cotton_dir, "classes.json")
        if os.path.exists(weights_path) and os.path.exists(classes_path):
            try:
                import torchvision.models as models
                from torchvision import transforms
                with open(classes_path, "r") as f:
                    cls_data = json.load(f)
                self.cotton_classes = cls_data if isinstance(cls_data, list) else [cls_data[str(i)] for i in range(len(cls_data))]
                model = models.densenet121(weights=None)
                model.classifier = nn.Linear(model.classifier.in_features, len(self.cotton_classes))
                ckpt = torch.load(weights_path, map_location=self.device)
                st = ckpt.get("model_state_dict", ckpt.get("state_dict", ckpt)) if isinstance(ckpt, dict) else ckpt
                model.load_state_dict({k.replace("module.", ""): v for k, v in st.items()})
                model.to(self.device)
                model.eval()
                self.cotton_model = model
                self.cotton_tfm = transforms.Compose([
                    transforms.Resize(256),
                    transforms.CenterCrop(224),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225))
                ])
                print("[+] Loaded Cotton Model (DenseNet-121) successfully.")
            except Exception as e:
                print(f"[-] Cotton Model load error: {e}")

    def load_potato(self):
        potato_path = os.path.join(self.pretrained_dir, "potato", "best.keras")
        if os.path.exists(potato_path):
            try:
                os.environ["KERAS_BACKEND"] = "tensorflow"
                import keras
                self.potato_model = keras.saving.load_model(potato_path)
                print("[+] Loaded Potato Model (DenseNet-169) successfully.")
            except Exception as e:
                print(f"[-] Potato Model load error: {e}")

    def load_rice(self):
        rice_dir = os.path.join(self.pretrained_dir, "rice")
        model_path = os.path.join(rice_dir, "model.safetensors")
        cfg_path = os.path.join(rice_dir, "config.json")
        if os.path.exists(model_path) and os.path.exists(cfg_path):
            try:
                import timm
                from safetensors.torch import load_file
                with open(cfg_path, "r") as f:
                    cfg = json.load(f)
                self.rice_labels = cfg.get("label_names", [])
                num_classes = len(self.rice_labels) if self.rice_labels else 17
                r_model = timm.create_model("efficientnet_b0", num_classes=num_classes, pretrained=False)
                st = load_file(model_path)
                r_model.load_state_dict(st)
                r_model.to(self.device)
                r_model.eval()
                self.rice_model = r_model
                timm_cfg = timm.data.resolve_data_config({}, model=r_model)
                self.rice_tfm = timm.data.create_transform(**timm_cfg)
                print("[+] Loaded Rice Model (EfficientNet-B0) successfully.")
            except Exception as e:
                print(f"[-] Rice Model load error: {e}")

    def load_tomato(self):
        tomato_dir = os.path.join(self.pretrained_dir, "tomato")
        if os.path.isdir(tomato_dir):
            try:
                from transformers import AutoImageProcessor, AutoModelForImageClassification
                self.tomato_proc = AutoImageProcessor.from_pretrained(tomato_dir)
                self.tomato_model = AutoModelForImageClassification.from_pretrained(tomato_dir)
                self.tomato_model.to(self.device)
                self.tomato_model.eval()
                print("[+] Loaded Tomato Model (ViT) successfully.")
            except Exception as e:
                print(f"[-] Tomato Model load error: {e}")

    def load_all(self):
        # 1. Load specialist notebook models
        self.load_beans()
        self.load_cotton()
        self.load_potato()
        self.load_rice()
        self.load_tomato()

        # 2. Load PlantVillage / YOLO fallback if configured
        if self.class_names_path and os.path.exists(self.class_names_path):
            try:
                with open(self.class_names_path, "r") as f:
                    self.class_names = json.load(f)
            except Exception:
                pass

        if self.yolo_path and os.path.exists(self.yolo_path):
            try:
                from ultralytics import YOLO
                self.yolo_model = YOLO(self.yolo_path)
                print(f"[+] YOLO loaded from {self.yolo_path}")
            except Exception as e:
                print(f"[-] YOLO load error: {e}")

    # ── Specialist Prediction Functions ──────────────────────────────────────────

    def predict_beans(self, img):
        if not self.beans_model or not self.beans_proc:
            return None
        inputs = self.beans_proc(images=img, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = self.beans_model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)[0]
        top_k = min(3, len(probs))
        top_probs, top_indices = torch.topk(probs, top_k)
        
        pred_idx = top_indices[0].item()
        conf = float(top_probs[0].item()) * 100
        raw_label = self.beans_model.config.id2label[pred_idx]
        
        # Clean label
        clean_map = {
            "angular_leaf_spot": "Angular Leaf Spot",
            "bean_rust": "Bean Rust",
            "healthy": "Healthy"
        }
        display_label = clean_map.get(raw_label.lower(), raw_label.replace("_", " ").title())
        
        top_predictions = [
            {
                "label": clean_map.get(self.beans_model.config.id2label[idx.item()].lower(), self.beans_model.config.id2label[idx.item()].replace("_", " ").title()),
                "confidence": round(float(p.item()) * 100, 2)
            }
            for p, idx in zip(top_probs, top_indices)
        ]
        
        return {
            "predicted_class": display_label,
            "confidence": round(conf, 2),
            "method": "Beans Specialist (ViT)",
            "top_predictions": top_predictions
        }

    def predict_cotton(self, img):
        if not self.cotton_model or not self.cotton_tfm:
            return None
        inp = self.cotton_tfm(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            output = self.cotton_model(inp)
        probs = F.softmax(output, dim=1)[0]
        top_k = min(4, len(probs))
        top_probs, top_indices = torch.topk(probs, top_k)
        
        pred_idx = top_indices[0].item()
        conf = float(top_probs[0].item()) * 100
        raw_label = self.cotton_classes[pred_idx]
        display_label = raw_label.title()
        
        top_predictions = [
            {
                "label": self.cotton_classes[idx.item()].title(),
                "confidence": round(float(p.item()) * 100, 2)
            }
            for p, idx in zip(top_probs, top_indices)
        ]
        
        return {
            "predicted_class": display_label,
            "confidence": round(conf, 2),
            "method": "Cotton Specialist (DenseNet-121)",
            "top_predictions": top_predictions
        }

    def predict_potato(self, img):
        if not self.potato_model:
            return None
        img_arr = np.expand_dims(np.array(img.resize((224, 224))) / 255.0, axis=0)
        preds = self.potato_model.predict(img_arr, verbose=0)[0]
        
        top_indices = np.argsort(preds)[::-1]
        pred_idx = top_indices[0]
        conf = float(preds[pred_idx]) * 100
        display_label = self.potato_classes[pred_idx]
        
        top_predictions = [
            {
                "label": self.potato_classes[idx],
                "confidence": round(float(preds[idx]) * 100, 2)
            }
            for idx in top_indices[:3]
        ]
        
        return {
            "predicted_class": display_label,
            "confidence": round(conf, 2),
            "method": "Potato Specialist (DenseNet-169)",
            "top_predictions": top_predictions
        }

    def predict_rice(self, img):
        if not self.rice_model or not self.rice_tfm:
            return None
        inp = self.rice_tfm(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            output = self.rice_model(inp)
        probs = F.softmax(output, dim=1)[0]
        top_k = min(5, len(probs))
        top_probs, top_indices = torch.topk(probs, top_k)
        
        pred_idx = int(top_indices[0].item())
        conf = float(top_probs[0].item()) * 100
        display_label = self.rice_labels[pred_idx].title() if pred_idx < len(self.rice_labels) else f"Rice Disease {pred_idx}"
        
        top_predictions = [
            {
                "label": self.rice_labels[int(idx.item())].title() if int(idx.item()) < len(self.rice_labels) else f"Class_{idx.item()}",
                "confidence": round(float(p.item()) * 100, 2)
            }
            for p, idx in zip(top_probs, top_indices)
        ]
        
        return {
            "predicted_class": display_label,
            "confidence": round(conf, 2),
            "method": "Rice Specialist (EfficientNet-B0)",
            "top_predictions": top_predictions
        }

    def predict_tomato(self, img):
        if not self.tomato_model or not self.tomato_proc:
            return None
        inputs = self.tomato_proc(images=img, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = self.tomato_model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)[0]
        top_k = min(5, len(probs))
        top_probs, top_indices = torch.topk(probs, top_k)
        
        pred_idx = top_indices[0].item()
        conf = float(top_probs[0].item()) * 100
        raw_label = self.tomato_model.config.id2label[pred_idx]
        
        # Clean label (e.g. "A tomato leaf with Late Blight" -> "Late Blight")
        def clean_tomato_label(lbl):
            l = lbl.replace("A healthy tomato leaf", "Healthy")
            l = l.replace("A tomato leaf with ", "")
            return l.strip()
        
        display_label = clean_tomato_label(raw_label)
        
        top_predictions = [
            {
                "label": clean_tomato_label(self.tomato_model.config.id2label[idx.item()]),
                "confidence": round(float(p.item()) * 100, 2)
            }
            for p, idx in zip(top_probs, top_indices)
        ]
        
        return {
            "predicted_class": display_label,
            "confidence": round(conf, 2),
            "method": "Tomato Specialist (ViT)",
            "top_predictions": top_predictions
        }

    # ── Master Prediction Dispatcher ─────────────────────────────────────────────

    def predict(self, img, user_crop=None):
        crop_low = (user_crop or "").strip().lower()

        # 1. Route to specialized notebook models
        if crop_low in ["beans", "bean"] and self.beans_model:
            res = self.predict_beans(img)
            if res: return res

        if crop_low in ["cotton"] and self.cotton_model:
            res = self.predict_cotton(img)
            if res: return res

        if crop_low in ["potato"] and self.potato_model:
            res = self.predict_potato(img)
            if res: return res

        if crop_low in ["rice", "paddy"] and self.rice_model:
            res = self.predict_rice(img)
            if res: return res

        if crop_low in ["tomato"] and self.tomato_model:
            res = self.predict_tomato(img)
            if res: return res

        # 2. Fallback to YOLO if available
        yolo_native_crops = ["banana", "chilli", "radish", "groundnut", "cauliflower"]
        if self.yolo_model and (not crop_low or crop_low in yolo_native_crops):
            try:
                yolo_res = self.yolo_model(img, verbose=False)
                if yolo_res and len(yolo_res[0].boxes) > 0:
                    box = yolo_res[0].boxes[0]
                    conf = float(box.conf[0]) * 100
                    label = self.yolo_model.names[int(box.cls[0])]
                    return {
                        "predicted_class": label,
                        "confidence": round(conf, 2),
                        "method": "YOLOv8 Ensemble",
                        "crop": user_crop or "Detected"
                    }
            except Exception as e:
                print(f"[-] YOLO inference error: {e}")

        # 3. If crop requested but not one of the 5 notebooks or YOLO, return Unknown with 0% to let backend AI fallback trigger
        return {
            "predicted_class": "Unknown",
            "confidence": 0.0,
            "method": "none",
            "crop": user_crop or "Unknown"
        }
