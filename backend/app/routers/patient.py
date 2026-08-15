from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.dependencies import get_db
from app.models.patient import Patient
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientSearchResponse,
    PatientProfileResponse,
    PatientUpdate
)

from app.schemas.timeline import (
    PatientTimelineResponse,
    TimelineMedicalRecord,
    TimelinePrescription
)

from app.utils.roles import require_role
from app.models.medical_record import MedicalRecord

from sqlalchemy.orm import joinedload

from app.models.medical_record import MedicalRecord
from app.schemas.timeline import (
    PatientTimelineResponse,
    TimelineMedicalRecord,
    TimelinePrescription
)

from app.models.prescription import Prescription

from app.schemas.beneficiary_card import (BeneficiaryCardResponse)

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

@router.get(
    "/card/{beneficiary_id}",
    response_model=BeneficiaryCardResponse
)
def beneficiary_card(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([
            "doctor",
            "registration_worker",
            "patient"
        ])
    )
):

    patient = (
        db.query(Patient)
        .options(
            joinedload(Patient.records).joinedload(
                MedicalRecord.prescriptions
            )
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

    total_prescriptions = 0

    for record in patient.records:
        total_prescriptions += len(
            record.prescriptions
        )

    return {
        "beneficiary_id": patient.beneficiary_id,
        "full_name": patient.full_name,
        "phone_number": patient.phone_number,
        "blood_group": patient.blood_group,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "emergency_contact": patient.emergency_contact,
        "total_medical_records": len(
            patient.records
        ),
        "total_prescriptions": total_prescriptions
    }

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
    print("Incoming Aadhaar:", patient.aadhar_number)
    print("Existing Patient:", existing_patient)

    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail="Patient already exists"
        )

    new_patient = Patient(
        beneficiary_id=beneficiary_id,
        full_name=patient.full_name,
        phone_number=patient.phone_number,
        aadhar_number=patient.aadhar_number,

        blood_group=patient.blood_group,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        height_cm=patient.height_cm,
        weight_kg=patient.weight_kg,
        emergency_contact=patient.emergency_contact
    )

    db.add(new_patient)

    db.commit()

    db.refresh(new_patient)

    return new_patient

@router.get(
    "/profile/{beneficiary_id}",
    response_model=PatientProfileResponse
)
def get_patient_profile(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([
            "doctor",
            "registration_worker",
            "patient"
        ])
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
            detail="Patient not found"
        )

    return {
        "beneficiary_id": patient.beneficiary_id,
        "full_name": patient.full_name,
        "phone_number": patient.phone_number,

        "blood_group": patient.blood_group,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "height_cm": patient.height_cm,
        "weight_kg": patient.weight_kg,
        "emergency_contact": patient.emergency_contact,

        "medical_records": patient.records
    }
    
@router.put(
    "/{beneficiary_id}",
    response_model=PatientResponse
)
def update_patient(
    beneficiary_id: str,
    updated_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([
            "doctor",
            "registration_worker"
        ])
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
            detail="Patient not found"
        )

    patient.phone_number = updated_data.phone_number
    patient.blood_group = updated_data.blood_group
    patient.date_of_birth = updated_data.date_of_birth
    patient.gender = updated_data.gender
    patient.height_cm = updated_data.height_cm
    patient.weight_kg = updated_data.weight_kg
    patient.emergency_contact = updated_data.emergency_contact

    db.commit()

    db.refresh(patient)

    return patient    

@router.get(
    "/timeline/{beneficiary_id}",
    response_model=PatientTimelineResponse
)
def patient_timeline(
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
            .joinedload(
                MedicalRecord.prescriptions
            )
            .joinedload(Prescription.medicine)
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

    medical_records = []

    for record in patient.records:

        prescriptions = []

        for prescription in record.prescriptions:

            prescriptions.append(
                TimelinePrescription(
                    id=prescription.id,
                    quantity=prescription.quantity,
                    dosage=prescription.dosage,
                    duration=prescription.duration,
                    dispensed=prescription.dispensed,
                    dispensed_at=prescription.dispensed_at,
                    medicine_name=prescription.medicine.medicine_name
                )
            )

        medical_records.append(
            TimelineMedicalRecord(
                id=record.id,
                diagnosis=record.diagnosis,
                prescription=record.prescription,
                notes=record.notes,
                prescriptions=prescriptions
            )
        )

    return {
        "beneficiary_id": patient.beneficiary_id,
        "full_name": patient.full_name,
        "medical_records": medical_records
    }
