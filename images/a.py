from pathlib import Path
from PIL import Image

BASE_DIR = Path("2025")
TARGET_EXTENSIONS = {".jpg", ".jpeg"}

def convert_to_webp(image_path: Path):
    webp_path = image_path.with_suffix(".webp")

    if webp_path.exists():
        return  # 이미 변환된 경우 건너뜀

    with Image.open(image_path) as img:
        img.save(webp_path, format="WEBP", quality=90, method=6)
        image_path.unlink()

def process_month_folder(month_folder: Path):
    for image_path in month_folder.rglob("*"):
        if image_path.suffix.lower() in TARGET_EXTENSIONS:
            convert_to_webp(image_path)

def main():
    for month in range(1, 13):
        month_folder = BASE_DIR / str(month)
        if month_folder.exists() and month_folder.is_dir():
            process_month_folder(month_folder)

if __name__ == "__main__":
    main()
