from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.medicalrecord import MedicalRecord
from app.models.prescription import Prescription
from app.models.medicine import Medicine


def build_patient_context(
    beneficiary_id: str,
    db: Session
):
    patient = (
        db.query(Patient)
        .filter(
            Patient.beneficiary_id == beneficiary_id
        )
        .first()
    )
    
    medical_records = (
        db.query(MedicalRecord)
        .filter(
            MedicalRecord.patient_id == patient.id
        )
        .all()
    )

    if not patient:
        return "Patient not found."

    context = f"""
========== PATIENT ==========
Beneficiary ID: {patient.beneficiary_id}
Name: {patient.full_name}
Phone: {patient.phone_number}

========== MEDICAL RECORDS ==========
"""

    for record in medical_records:

        context += f"""

Diagnosis:
{record.diagnosis}

Symptoms:
{record.symptoms}

Doctor Notes:
{record.doctor_notes}
"""

    return context