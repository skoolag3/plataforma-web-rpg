from pathlib import Path
from docx import Document


docx_path = Path(r"C:\Users\redga\Downloads\RT-TDS-2026-037_v0.12.docx")
doc = Document(docx_path)

for index, paragraph in enumerate(doc.paragraphs):
    text = paragraph.text.strip().replace("\n", " / ")
    drawings = paragraph._p.xpath(".//w:drawing")
    if text or drawings:
        print(f"{index:04d} | style={paragraph.style.name!r} | drawings={len(drawings)} | {text[:180]}")

print(f"paragraphs={len(doc.paragraphs)} inline_shapes={len(doc.inline_shapes)} tables={len(doc.tables)} sections={len(doc.sections)}")
for i, section in enumerate(doc.sections):
    print(f"section {i}: page={section.page_width.inches:.2f}x{section.page_height.inches:.2f} margins={section.left_margin.inches:.2f},{section.right_margin.inches:.2f},{section.top_margin.inches:.2f},{section.bottom_margin.inches:.2f}")
for i, shape in enumerate(doc.inline_shapes):
    print(f"shape {i}: {shape.width.inches:.2f}x{shape.height.inches:.2f}")
