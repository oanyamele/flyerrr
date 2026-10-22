from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
SOURCE_IMAGE = ROOT / "output" / "architecture" / "Flyerrr_Current_System_Architecture.png"
OUTPUT_PDF = ROOT / "output" / "pdf" / "Flyerrr_Project_Architecture_Baseline.pdf"


def fit_image(source_width: int, source_height: int, max_width: float, max_height: float) -> tuple[float, float]:
    scale = min(max_width / source_width, max_height / source_height)
    return source_width * scale, source_height * scale


def build_pdf() -> None:
    if not SOURCE_IMAGE.exists():
        raise FileNotFoundError(f"Architecture image not found: {SOURCE_IMAGE}")

    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = landscape(letter)
    pdf = canvas.Canvas(str(OUTPUT_PDF), pagesize=(page_width, page_height))
    pdf.setTitle("Flyerrr Project Architecture Baseline")
    pdf.setAuthor("Flyerrr Project Team")
    pdf.setSubject("Current-state component and data-flow architecture")

    navy = HexColor("#172554")
    slate = HexColor("#475569")
    line = HexColor("#CBD5E1")
    green = HexColor("#16A34A")
    amber = HexColor("#CA8A04")
    rose = HexColor("#E11D48")

    margin_x = 26
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(margin_x, page_height - 29, "Flyerrr Project Architecture Baseline")

    pdf.setFillColor(slate)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawString(
        margin_x,
        page_height - 43,
        "Current-state component and data-flow view - verified against the repository on September 27, 2026",
    )

    pdf.setStrokeColor(line)
    pdf.setLineWidth(0.7)
    pdf.line(margin_x, page_height - 49, page_width - margin_x, page_height - 49)

    image = ImageReader(str(SOURCE_IMAGE))
    source_width, source_height = image.getSize()
    image_width, image_height = fit_image(
        source_width,
        source_height,
        page_width - (2 * margin_x),
        page_height - 96,
    )
    image_x = (page_width - image_width) / 2
    image_y = 39 + ((page_height - 89 - image_height) / 2)
    pdf.drawImage(
        image,
        image_x,
        image_y,
        width=image_width,
        height=image_height,
        preserveAspectRatio=True,
        mask="auto",
    )

    legend_y = 21
    pdf.setFont("Helvetica", 7.3)
    pdf.setFillColor(slate)
    pdf.drawString(margin_x, legend_y, "Solid arrows: implemented runtime calls and data flow")

    pdf.setFillColor(green)
    pdf.rect(265, legend_y - 1, 7, 7, fill=1, stroke=0)
    pdf.setFillColor(slate)
    pdf.drawString(277, legend_y, "data modules")

    pdf.setFillColor(amber)
    pdf.rect(357, legend_y - 1, 7, 7, fill=1, stroke=0)
    pdf.setFillColor(slate)
    pdf.drawString(369, legend_y, "browser persistence")

    pdf.setFillColor(rose)
    pdf.rect(472, legend_y - 1, 7, 7, fill=1, stroke=0)
    pdf.setFillColor(slate)
    pdf.drawString(484, legend_y, "missing backend boundary")

    pdf.setFont("Helvetica-Oblique", 7.3)
    pdf.drawRightString(page_width - margin_x, legend_y, "Source: src/App.tsx, src/pages, src/contexts, and src/data")

    pdf.showPage()
    pdf.save()
    print(OUTPUT_PDF)


if __name__ == "__main__":
    build_pdf()
