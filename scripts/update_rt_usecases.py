import re
from pathlib import Path

from PIL import Image
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches


SOURCE = Path(r"C:\Users\redga\Downloads\RT-TDS-2026-037_v0.12.docx")
OUTPUT = Path(r"C:\Users\redga\Downloads\RT-TDS-2026-037_v0.13.docx")
TEMP_DIR = Path(r"C:\Users\redga\AppData\Local\Temp\codex-rt-usecases")

FIGURES = [
    ("Autenticação e perfil", Path(r"C:\Users\redga\Documents\tccfasefinal\UseCase\UseCase Auth e perfil.png")),
    ("Coleção e decks", Path(r"C:\Users\redga\Documents\tccfasefinal\UseCase\Coleção e decks.png")),
    ("Gacha e loja", Path(r"C:\Users\redga\Documents\tccfasefinal\UseCase\Gacha e loja.png")),
    ("Expedição", Path(r"C:\Users\redga\Documents\tccfasefinal\UseCase\Expedição.png")),
    ("Administração de cartas", Path(r"C:\Users\redga\Documents\tccfasefinal\UseCase\Administração - Cartas.png")),
    ("Administração de classes e habilidades", Path(r"C:\Users\redga\Documents\tccfasefinal\UseCase\Administração - Classes e habilidades.png")),
    ("Administração de painel e comunicação", Path(r"C:\Users\redga\Documents\tccfasefinal\UseCase\Administração - Painel e comunicação.png")),
    ("Administração de usuários", Path(r"C:\Users\redga\Documents\tccfasefinal\UseCase\Administração - Usuários.png")),
]


def remove_paragraph(paragraph):
    element = paragraph._element
    element.getparent().remove(element)


def crop_for_report(source: Path, destination: Path):
    with Image.open(source).convert("RGB") as image:
        pixels = image.load()
        xs = []
        ys = []
        for y in range(image.height):
            for x in range(image.width):
                red, green, blue = pixels[x, y]
                if red >= 225 and green >= 225 and blue <= 235 and red - blue >= 12:
                    xs.append(x)
                    ys.append(y)

        if not xs:
            image.save(destination)
            return

        left = max(0, min(xs) - 175)
        top = max(0, min(ys) - 30)
        right = min(image.width, max(xs) + 176)
        bottom = min(image.height, max(ys) + 31)
        image.crop((left, top, right, bottom)).save(destination, quality=95)


def set_update_fields_on_open(doc):
    settings = doc.settings._element
    current = settings.find(qn("w:updateFields"))
    if current is None:
        current = OxmlElement("w:updateFields")
        settings.append(current)
    current.set(qn("w:val"), "true")


def main():
    missing = [str(path) for _, path in FIGURES if not path.exists()]
    if missing:
        raise FileNotFoundError("Imagens ausentes:\n" + "\n".join(missing))

    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    cropped = []
    for number, (_, source) in enumerate(FIGURES, start=1):
        destination = TEMP_DIR / f"usecase-{number:02d}.png"
        crop_for_report(source, destination)
        cropped.append(destination)

    doc = Document(SOURCE)
    paragraphs = doc.paragraphs
    start = next(i for i, p in enumerate(paragraphs) if p.text.strip().startswith("Figura 1 - Diagrama de Casos de Uso"))
    end = next(i for i, p in enumerate(paragraphs) if p.text.strip() == "Diagrama de Classes")
    anchor = paragraphs[end]

    for paragraph in paragraphs[end:]:
        match = re.match(r"^(Figura)\s+(\d+)\s+(-.*)$", paragraph.text.strip())
        if not match:
            continue
        number = int(match.group(2))
        if number >= 6:
            paragraph.text = f"{match.group(1)} {number + 3} {match.group(3)}"

    for paragraph in paragraphs[start:end]:
        remove_paragraph(paragraph)

    for number, ((title, _), image_path) in enumerate(zip(FIGURES, cropped), start=1):
        caption = anchor.insert_paragraph_before(f"Figura {number} - Diagrama de Casos de Uso: {title}")
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        caption.paragraph_format.keep_with_next = True
        if number > 1:
            caption.paragraph_format.page_break_before = True

        picture = anchor.insert_paragraph_before()
        picture.alignment = WD_ALIGN_PARAGRAPH.CENTER
        picture.paragraph_format.space_after = Inches(0.08)
        picture.add_run().add_picture(str(image_path), width=Inches(6.25))

    set_update_fields_on_open(doc)
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
