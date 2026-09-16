from pathlib import Path

from docx import Document


SOURCE = Path(r"C:\Users\redga\Downloads\RT-TDS-2026-037_v0.13.docx")
OUTPUT = Path(r"C:\Users\redga\Downloads\RT-TDS-2026-037_v0.14.docx")


def remove_paragraph(paragraph):
    element = paragraph._element
    element.getparent().remove(element)


doc = Document(SOURCE)
removed = []

for paragraph in list(doc.paragraphs):
    text = paragraph.text.strip()
    if text.startswith("RN20 - Chefe:"):
        removed.append(text)
        remove_paragraph(paragraph)
    elif text.startswith("RN21 - Inteligência artificial:"):
        for run in paragraph.runs:
            if "RN21" in run.text:
                run.text = run.text.replace("RN21", "RN20", 1)
                break

if len(removed) != 1:
    raise RuntimeError(f"Esperava remover exatamente uma RN20, mas encontrei {len(removed)}")

doc.save(OUTPUT)
print(f"removido: {removed[0]}")
print(OUTPUT)
