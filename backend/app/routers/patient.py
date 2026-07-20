from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.dependencies import get_db
from app.models.patient import Patient
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientSearchResponse
)

from app.utils.roles import require_role

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
    )
    
@router.get("/", response_model=list[PatientResponse])
def get_all_patients(
    db: Session = Depends(get_db)
):
    patients = db.query(Patient).all()

    return patients

@router.get(
    "/search",
    response_model=list[PatientSearchResponse]
)
def search_patients(
    name: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor", "registration_worker"])
    )
):
    patients = (
        db.query(Patient)
        .filter(
            Patient.full_name.ilike(f"%{name}%")
        )
        .all()
    )

    return patients

@router.get(
    "/all",
    response_model=list[PatientSearchResponse]
)
def list_all_patients(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    patients = db.query(Patient).all()

    return patients

@router.get("/{beneficiary_id}", response_model=PatientResponse)
def get_patient(
    beneficiary_id: str,
    db: Session = Depends(get_db)
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
            detail="Patient not found"
        )

    return patient

@router.post(
    "/",
    response_model=PatientResponse
)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["registration_worker"])
    )
):
    
    current_year = datetime.now().strftime("%y")

    last_patient = (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .first()
    )

    if last_patient:

        last_number = int(
            last_patient.beneficiary_id[-4:]
        )

        new_number = last_number + 1

    else:
        new_number = 1

    beneficiary_id = (
        f"MV{current_year}{new_number:04d}"
    )
    
    existing_patient = (
    db.query(Patient)
    .filter(
        Patient.aadhar_number ==
        patient.aadhar_number
    )
    .first()
)

    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail="Patient already exists"
        )

    new_patient = Patient(
        beneficiary_id=beneficiary_id,
        full_name=patient.full_name,
        phone_number=patient.phone_number,
        aadhar_number=patient.aadhar_number
    )

    db.add(new_patient)

    db.commit()

    db.refresh(new_patient)

    return new_patient