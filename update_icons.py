import os
from PIL import Image

src_path = "frontend/public/raccoon-detective.webp"
if not os.path.exists(src_path):
    print("Source image not found:", src_path)
    exit(1)

img = Image.open(src_path).convert("RGBA")

android_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

base_android_dir = "frontend/android/app/src/main/res"

for folder, size in android_sizes.items():
    folder_path = os.path.join(base_android_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    resized = img.resize((size, size), Image.Resampling.LANCZOS)

    for filename in ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]:
        out_path = os.path.join(folder_path, filename)
        resized.save(out_path, "PNG")
        print(f"Saved {out_path} ({size}x{size})")

ios_dir = "frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset"
os.makedirs(ios_dir, exist_ok=True)
ios_img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
ios_path = os.path.join(ios_dir, "AppIcon-512@2x.png")
ios_img.save(ios_path, "PNG")
print(f"Saved iOS AppIcon {ios_path} (1024x1024)")

print("All app icons updated successfully!")
