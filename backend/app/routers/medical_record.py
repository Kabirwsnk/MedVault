from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordResponse,
    MedicalRecordUpdate,
)
from app.schemas.patient import PatientProfileResponse
from app.utils.roles import ROLE_ADMIN, ROLE_DOCTOR, require_role

router = APIRouter(
    prefix="/medical-records",
    tags=["Medical Records"]
)


# ------------------------------------------
# Add Medical Record (Doctor Only)
# ------------------------------------------
@router.post(
    "/{beneficiary_id}",
    response_model=MedicalRecordResponse
)
def add_medical_record(
    beneficiary_id: str,
    record: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role([ROLE_DOCTOR])),
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
        doctor_id=current_user.id,
        diagnosis=record.diagnosis,
        prescription=record.prescription,
        notes=record.notes
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


# ------------------------------------------
# Get Complete Medical History
# ------------------------------------------
@router.get("/{beneficiary_id}")
def get_medical_history(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role([ROLE_DOCTOR])),
):
    patient = (
        db.query(Patient)
        .options(joinedload(Patient.records))
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
        "patient_name": patient.full_name,
        "records": patient.records
    }


# ------------------------------------------
# Get Patient Profile
# ------------------------------------------
@router.get(
    "/profile/{beneficiary_id}",
    response_model=PatientProfileResponse
)
def get_patient_profile(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role([ROLE_DOCTOR])),
):
    patient = (
        db.query(Patient)
        .options(joinedload(Patient.records))
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


# ------------------------------------------
# Update Medical Record (Authoring Doctor / Admin)
# ------------------------------------------
@router.put(
    "/{record_id}",
    response_model=MedicalRecordResponse
)
def update_medical_record(
    record_id: int,
    updated_data: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([ROLE_DOCTOR, ROLE_ADMIN])
    ),
):
    record = (
        db.query(MedicalRecord)
        .filter(
            MedicalRecord.id == record_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Medical record not found"
        )

    if current_user.role != ROLE_ADMIN and record.doctor_id is not None and record.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit another doctor's medical record."
        )

    record.diagnosis = updated_data.diagnosis
    record.prescription = updated_data.prescription
    record.notes = updated_data.notes

    db.commit()
    db.refresh(record)

    return record
