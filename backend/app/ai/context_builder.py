from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription

async def build_patient_context(
    beneficiary_id: str,
    db: AsyncSession,
):
    result = await db.execute(
        select(Patient).where(Patient.beneficiary_id == beneficiary_id)
    )
    patient = result.scalar_one_or_none()

    if not patient:
        return "Patient not found."

    # Get all medical records
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.patient_id == patient.id)
    )
    medical_records = result.scalars().all()

    # Get all prescriptions for this patient
    result = await db.execute(
        select(Prescription)
        .join(MedicalRecord)
        .options(selectinload(Prescription.medicine))
        .where(MedicalRecord.patient_id == patient.id)
    )
    prescriptions = result.scalars().all()

    # Start building context
    context = f"""
========== PATIENT ==========
Beneficiary ID: {patient.beneficiary_id}
Name: {patient.full_name}
Phone: {patient.phone_number}

========== MEDICAL RECORDS ==========
"""

    # Add medical records
    for record in medical_records:

        context += f"""

Diagnosis:
{record.diagnosis}

Prescription:
{record.prescription}

Doctor Notes:
{record.notes}
"""

    # Add prescriptions
    context += """

========== PRESCRIPTIONS ==========
"""

    for prescription in prescriptions:

        context += f"""

Medicine:
{prescription.medicine.medicine_name}

Manufacturer:
{prescription.medicine.manufacturer}

Dosage:
{prescription.dosage}

Duration:
{prescription.duration}

Quantity:
{prescription.quantity}

Dispensed:
{"Yes" if prescription.dispensed else "No"}

Current Stock:
{prescription.medicine.stock} {prescription.medicine.unit}
"""

    return context