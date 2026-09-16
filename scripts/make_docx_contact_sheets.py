from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


source_dir = Path(r"C:\Users\redga\AppData\Local\Temp\rt-v013-word-pages-final")
output_dir = Path(r"C:\Users\redga\AppData\Local\Temp\rt-v013-contact-final")
output_dir.mkdir(parents=True, exist_ok=True)
pages = sorted(source_dir.glob("page-*.png"))
thumb_w, thumb_h = 330, 467
label_h = 25

for sheet_number, start in enumerate(range(0, len(pages), 9), start=1):
    subset = pages[start:start + 9]
    sheet = Image.new("RGB", (thumb_w * 3, (thumb_h + label_h) * 3), "#d8d8d8")
    draw = ImageDraw.Draw(sheet)
    for slot, page in enumerate(subset):
        with Image.open(page).convert("RGB") as image:
            image.thumbnail((thumb_w - 8, thumb_h - 8))
            col, row = slot % 3, slot // 3
            x = col * thumb_w + (thumb_w - image.width) // 2
            y = row * (thumb_h + label_h) + label_h + (thumb_h - image.height) // 2
            sheet.paste(image, (x, y))
            draw.text((col * thumb_w + 8, row * (thumb_h + label_h) + 5), page.stem, fill="black")
    sheet.save(output_dir / f"sheet-{sheet_number}.png")

print("\n".join(str(path) for path in sorted(output_dir.glob("sheet-*.png"))))
