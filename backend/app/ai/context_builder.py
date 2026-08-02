from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription

def build_patient_context(
    beneficiary_id: str,
    db: Session
):
    # Get patient
    patient = (
        db.query(Patient)
        .filter(
            Patient.beneficiary_id == beneficiary_id
        )
        .first()
    )

    if not patient:
        return "Patient not found."

    # Get all medical records
    medical_records = (
        db.query(MedicalRecord)
        .filter(
            MedicalRecord.patient_id == patient.id
        )
        .all()
    )

    # Get all prescriptions for this patient
    prescriptions = (
        db.query(Prescription)
        .join(MedicalRecord)
        .filter(
            MedicalRecord.patient_id == patient.id
        )
        .all()
    )

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