import io
import json
from datetime import date

import qrcode
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.patient import Patient


def generate_qr_code_bytes(data: str) -> bytes:
    """Generate PNG bytes of a QR code containing verifiable patient card data."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1E3A8A", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


def generate_beneficiary_card_pdf(
    patient: Patient,
    total_records: int,
    total_prescriptions: int,
) -> bytes:
    """Generate a clean, high-resolution printable PDF Beneficiary Card."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4

    # Card dimensions (Landscape Wallet/Certificate Card)
    card_width = 440
    card_height = 270
    card_x = (page_width - card_width) / 2
    card_y = page_height - card_height - 100

    # Draw Outer Card Border and Background
    p.setFillColor(colors.HexColor("#F8FAFC"))
    p.setStrokeColor(colors.HexColor("#CBD5E1"))
    p.setLineWidth(1.5)
    p.roundRect(card_x, card_y, card_width, card_height, radius=12, fill=1, stroke=1)

    # Header Bar
    p.setFillColor(colors.HexColor("#1E3A8A"))
    p.roundRect(card_x, card_y + card_height - 55, card_width, 55, radius=12, fill=1, stroke=0)
    # Fill square corners at bottom of header
    p.rect(card_x, card_y + card_height - 55, card_width, 20, fill=1, stroke=0)

    # Header Text
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 18)
    p.drawString(card_x + 20, card_y + card_height - 32, "MEDVAULT AI")
    p.setFont("Helvetica", 10)
    p.drawString(card_x + 20, card_y + card_height - 47, "Digital Healthcare Identity Card")

    # Header Badge (Beneficiary ID)
    p.setFillColor(colors.HexColor("#3B82F6"))
    p.roundRect(card_x + card_width - 135, card_y + card_height - 45, 120, 28, radius=6, fill=1, stroke=0)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 12)
    p.drawCentredString(card_x + card_width - 75, card_y + card_height - 35, patient.beneficiary_id)

    # Patient Details Grid
    left_x = card_x + 25
    content_top = card_y + card_height - 75
    line_spacing = 22

    details = [
        ("Full Name:", patient.full_name or "N/A"),
        ("Phone Number:", patient.phone_number or "N/A"),
        ("Blood Group:", patient.blood_group or "N/A"),
        ("Date of Birth:", str(patient.date_of_birth) if patient.date_of_birth else "N/A"),
        ("Gender:", patient.gender or "N/A"),
        ("Emergency Contact:", patient.emergency_contact or "N/A"),
    ]

    for i, (label, val) in enumerate(details):
        curr_y = content_top - (i * line_spacing)
        p.setFont("Helvetica-Bold", 10)
        p.setFillColor(colors.HexColor("#475569"))
        p.drawString(left_x, curr_y, label)

        p.setFont("Helvetica-Bold" if label == "Full Name:" else "Helvetica", 10)
        p.setFillColor(colors.HexColor("#0F172A"))
        p.drawString(left_x + 115, curr_y, str(val))

    # Generate and Embed QR Code
    qr_payload = json.dumps({
        "beneficiary_id": patient.beneficiary_id,
        "name": patient.full_name,
        "phone": patient.phone_number,
        "blood_group": patient.blood_group,
        "emergency": patient.emergency_contact,
        "verified": True,
    })
    qr_bytes = generate_qr_code_bytes(qr_payload)
    qr_img = Image.open(io.BytesIO(qr_bytes))

    # Save temporary reader image onto canvas
    qr_size = 90
    qr_x = card_x + card_width - qr_size - 25
    qr_y = card_y + 40
    p.drawInlineImage(qr_img, qr_x, qr_y, width=qr_size, height=qr_size)

    p.setFont("Helvetica", 8)
    p.setFillColor(colors.HexColor("#64748B"))
    p.drawCentredString(qr_x + (qr_size / 2), qr_y - 12, "Scan to Verify Record")

    # Bottom Statistics Summary Box
    stats_y = card_y + 12
    p.setFont("Helvetica", 8)
    p.setFillColor(colors.HexColor("#64748B"))
    stats_text = f"Encounter Records: {total_records}  |  Prescriptions: {total_prescriptions}  |  Issued: {date.today().isoformat()}"
    p.drawString(left_x, stats_y, stats_text)

    # Watermark / Sub-text
    p.setFont("Helvetica-Oblique", 9)
    p.setFillColor(colors.HexColor("#94A3B8"))
    p.drawCentredString(page_width / 2, card_y - 30, "MedVault AI Secure Health Information Network — Official Patient Identification")

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()
