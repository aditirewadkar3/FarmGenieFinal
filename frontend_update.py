import json

# 1. Update DiseaseDetection.jsx
jsx_path = 'frontend/src/components/DiseaseDetection.jsx'
with open(jsx_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add crops after Cauliflower
old_crops_needle = """  { id: 'Cauliflower', icon: Sprout, image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=200', harvestImage: 'https://images.unsplash.com/photo-1510627489930-0c1b0ba0cc1c?auto=format&fit=crop&q=80&w=300', color: 'from-emerald-400 to-green-600', bgLight: 'from-emerald-50 to-green-50', border: 'border-emerald-300', shadow: 'shadow-emerald-200', emoji: '🥦' },"""

new_crops = """  { id: 'Cauliflower', icon: Sprout, image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=200', harvestImage: 'https://images.unsplash.com/photo-1510627489930-0c1b0ba0cc1c?auto=format&fit=crop&q=80&w=300', color: 'from-emerald-400 to-green-600', bgLight: 'from-emerald-50 to-green-50', border: 'border-emerald-300', shadow: 'shadow-emerald-200', emoji: '🥦' },
  // Models integrated from notebooks
  { id: 'Beans', icon: Sprout, image: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&q=80&w=200', harvestImage: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&q=80&w=300', color: 'from-emerald-500 to-green-700', bgLight: 'from-emerald-50 to-green-50', border: 'border-emerald-400', shadow: 'shadow-emerald-200', emoji: '🫘' },
  { id: 'Cotton', icon: Sprout, image: 'https://images.unsplash.com/photo-1594488506255-a88bf0a01047?auto=format&fit=crop&q=80&w=200', harvestImage: 'https://images.unsplash.com/photo-1594488506255-a88bf0a01047?auto=format&fit=crop&q=80&w=300', color: 'from-sky-400 to-indigo-500', bgLight: 'from-sky-50 to-indigo-50', border: 'border-sky-300', shadow: 'shadow-sky-200', emoji: '☁️' },
  { id: 'Rice', icon: Sprout, image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&q=80&w=200', harvestImage: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&q=80&w=300', color: 'from-lime-500 to-emerald-600', bgLight: 'from-lime-50 to-emerald-50', border: 'border-lime-300', shadow: 'shadow-lime-200', emoji: '🌾' },"""

if old_crops_needle in code:
    code = code.replace(old_crops_needle, new_crops)

# Add new class labels to CLASS_LABELS
old_labels_needle = """  // Banana
  banana_bract_mosaic_virus: 'Bract Mosaic Virus',"""

new_labels = """  // Beans
  angular_leaf_spot: 'Angular Leaf Spot',
  bean_rust: 'Bean Rust',
  beans_healthy: 'Healthy Bean',
  // Cotton
  'bacterial blight': 'Bacterial Blight',
  'curl virus': 'Curl Virus',
  'fussarium wilt': 'Fusarium Wilt',
  cotton_healthy: 'Healthy Cotton',
  // Rice
  bacterial_leaf_blight: 'Bacterial Leaf Blight',
  brown_spot: 'Brown Spot',
  leaf_blast: 'Leaf Blast',
  leaf_scald: 'Leaf Scald',
  narrow_brown_spot: 'Narrow Brown Spot',
  neck_blast: 'Neck Blast',
  rice_false_smut: 'Rice False Smut',
  sheath_blight: 'Sheath Blight',
  sheath_rot: 'Sheath Rot',
  rice_healthy: 'Healthy Rice',
  // Potato
  'Early Blight': 'Early Blight',
  'Late Blight': 'Late Blight',
  potato_healthy: 'Healthy Potato',
  // Banana
  banana_bract_mosaic_virus: 'Bract Mosaic Virus',"""

if old_labels_needle in code:
    code = code.replace(old_labels_needle, new_labels)

with open(jsx_path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(code)
print('Updated DiseaseDetection.jsx')

# 2. Update i18n JSON files
locales = {
    'en': {'beans': 'Beans', 'cotton': 'Cotton', 'rice': 'Rice'},
    'hi': {'beans': 'सेम / बीन्स', 'cotton': 'कपास', 'rice': 'चावल / धान'},
    'mr': {'beans': 'घेवडा / बीन्स', 'cotton': 'कापूस', 'rice': 'भात / तांदूळ'}
}

for lang, additions in locales.items():
    l_path = f'frontend/src/i18n/locales/{lang}.json'
    with open(l_path, 'r', encoding='utf-8') as f:
        d = json.load(f)
    if 'crops' in d:
        for k, v in additions.items():
            d['crops'][k] = v
        with open(l_path, 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
        print(f'Updated {lang}.json')
