from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_db
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordResponse
)
from app.utils.roles import require_role
from app.schemas.patient import PatientProfileResponse
from sqlalchemy.orm import joinedload

router = APIRouter(
    prefix="/medical-records",
    tags=["Medical Records"]
)
        
@router.post(
    "/{beneficiary_id}",
    response_model=MedicalRecordResponse
)
def add_medical_record(
    beneficiary_id: str,
    record: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.beneficiary_id == beneficiary_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found."
        )

    new_record = MedicalRecord(
        patient_id=patient.id,
        diagnosis=record.diagnosis,
        prescription=record.prescription,
        notes=record.notes
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record  

@router.get(
    "/profile/{beneficiary_id}",
    response_model=PatientProfileResponse
)
def get_patient_profile(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    patient = (
        db.query(Patient)
        .options(
            joinedload(Patient.records)
        )
        .filter(
            Patient.beneficiary_id == beneficiary_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found."
        )

    return {
        "beneficiary_id": patient.beneficiary_id,
        "full_name": patient.full_name,
        "phone_number": patient.phone_number,
        "medical_records": patient.records
    }
      