p = 'backend/src/controllers/diseaseReport.controller.js'
with open(p, 'r', encoding='utf-8') as f:
    text = f.read()

target = """const SUPPORTED_CROPS = [
  // YOLO custom trained
  "Banana", "Chilli", "Radish", "Groundnut", "Cauliflower",
  // PlantVillage pretrained (EfficientNet-B0 + MobileNetV2)
  "Apple", "Blueberry", "Cherry", "Corn", "Grape", "Orange",
  "Peach", "Pepper", "Potato", "Raspberry", "Soybean", "Squash",
  "Strawberry", "Tomato"
];"""

replacement = """const SUPPORTED_CROPS = [
  // Hugging Face models from notebooks
  "Beans", "Bean", "Cotton", "Potato", "Rice", "Tomato",
  // YOLO custom trained
  "Banana", "Chilli", "Radish", "Groundnut", "Cauliflower",
  // PlantVillage pretrained (EfficientNet-B0 + MobileNetV2)
  "Apple", "Blueberry", "Cherry", "Corn", "Grape", "Orange",
  "Peach", "Pepper", "Raspberry", "Soybean", "Squash",
  "Strawberry"
];"""

if target in text:
    text = text.replace(target, replacement)
else:
    # Normalize CRLF and check
    text_crlf = text.replace('\r\n', '\n')
    target_crlf = target.replace('\r\n', '\n')
    if target_crlf in text_crlf:
        text = text_crlf.replace(target_crlf, replacement)

old_regex = "/^(banana|chilli|radish|groundnut|cauliflower|apple|tomato|potato|corn|grape|peach|pepper|soybean|strawberry|squash)_/i"
new_regex = "/^(banana|chilli|radish|groundnut|cauliflower|apple|tomato|potato|corn|grape|peach|pepper|soybean|strawberry|squash|beans|cotton|rice)_/i"
if old_regex in text:
    text = text.replace(old_regex, new_regex)

with open(p, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)
print('Successfully updated diseaseReport.controller.js')
p2 = 'backend/src/services/mlServer.service.js'
with open(p2, 'r', encoding='utf-8') as f:
    text2 = f.read()
text2 = text2.replace('return status.includes("running");', 'return status.includes("running") || status.includes("online");')
with open(p2, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text2)
print('Updated mlServer.service.js')
