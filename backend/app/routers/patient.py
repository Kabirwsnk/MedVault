from datetime import datetime
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text

from app.dependencies import get_db
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientSearchResponse,
    PatientProfileResponse,
    PatientUpdate,
)
from app.schemas.timeline import (
    PatientTimelineResponse,
    TimelineMedicalRecord,
    TimelinePrescription,
)
from app.schemas.beneficiary_card import BeneficiaryCardResponse
from app.services.card_service import (
    generate_beneficiary_card_pdf,
    generate_qr_code_bytes,
)
from app.utils.roles import (
    ROLE_ADMIN,
    ROLE_DOCTOR,
    ROLE_PATIENT,
    ROLE_REGISTRATION_WORKER,
    require_role,
)
from app.utils.authorization import CLINICAL_STAFF, DEMOGRAPHIC_STAFF, require_patient_access

router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
)


# ----------------------------------------------------------
# Fixed-path routes FIRST (before the /{beneficiary_id} catch-all)
# ----------------------------------------------------------

@router.get("/", response_model=list[PatientResponse])
def get_all_patients(
    db: Session = Depends(get_db),
    current_user=Depends(require_role([ROLE_DOCTOR, ROLE_REGISTRATION_WORKER, ROLE_ADMIN])),
):
    patients = db.query(Patient).all()

    return patients


@router.get(
    "/search",
    response_model=list[PatientSearchResponse],
)
def search_patients(
    name: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor", "registration_worker"])
    ),
):
    patients = (
        db.query(Patient)
        .filter(
            Patient.full_name.ilike(f"%{name}%")
        )
        .all()
    )

    return patients


# NOTE: The former GET /patients/all endpoint was removed (P3).
# It duplicated GET /patients/ with a more restrictive role set.
# Use GET /patients/ instead.


@router.post(
    "/",
    response_model=PatientResponse,
)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["registration_worker"])
    ),
):
    
    current_year = datetime.now().strftime("%y")

# Prevent two registration workers from generating
# the same beneficiary ID at the same time.
    db.execute(
        text("SELECT pg_advisory_xact_lock(260001)")
    )
    
    last_patient = (
        db.query(Patient)
        .filter(
            Patient.beneficiary_id.like(
                f"MV{current_year}%"
            )
        )
        .order_by(
            Patient.beneficiary_id.desc()
        )
        .first()
    )
    if last_patient:
        last_number = int(
            last_patient.beneficiary_id[-4:]
        )
        new_number = last_number + 1
    else:
        new_number = 1
        
    if new_number > 9999:
        raise HTTPException(
            status_code=400,
            detail="Beneficiary ID limit reached for the current year."
        )

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
        aadhar_number=patient.aadhar_number,

        blood_group=patient.blood_group,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        height_cm=patient.height_cm,
        weight_kg=patient.weight_kg,
        emergency_contact=patient.emergency_contact,
    )

    db.add(new_patient)

    db.commit()

    db.refresh(new_patient)

    return new_patient


# ----------------------------------------------------------
# Sub-path routes with extra segments — safe before catch-all
# but grouped here for clarity.
# ----------------------------------------------------------

@router.get(
    "/card/{beneficiary_id}",
    response_model=BeneficiaryCardResponse,
)
def beneficiary_card(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([
            ROLE_DOCTOR, ROLE_REGISTRATION_WORKER, ROLE_PATIENT, ROLE_ADMIN,
        ])
    ),
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

    require_patient_access(current_user, patient, DEMOGRAPHIC_STAFF)

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
        "total_prescriptions": total_prescriptions,
    }


@router.get(
    "/card/{beneficiary_id}/qr",
)
def beneficiary_card_qr(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([
            ROLE_DOCTOR, ROLE_REGISTRATION_WORKER, ROLE_PATIENT, ROLE_ADMIN,
        ])
    ),
):
    patient = (
        db.query(Patient)
        .filter(Patient.beneficiary_id == beneficiary_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found."
        )

    require_patient_access(current_user, patient, DEMOGRAPHIC_STAFF)

    qr_payload = json.dumps({
        "beneficiary_id": patient.beneficiary_id,
        "name": patient.full_name,
        "phone": patient.phone_number,
        "blood_group": patient.blood_group,
        "emergency": patient.emergency_contact,
        "verified": True,
    })
    qr_bytes = generate_qr_code_bytes(qr_payload)
    return Response(content=qr_bytes, media_type="image/png")


@router.get(
    "/card/{beneficiary_id}/pdf",
)
def beneficiary_card_pdf(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([
            ROLE_DOCTOR, ROLE_REGISTRATION_WORKER, ROLE_PATIENT, ROLE_ADMIN,
        ])
    ),
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

    require_patient_access(current_user, patient, DEMOGRAPHIC_STAFF)

    total_prescriptions = sum(len(r.prescriptions) for r in patient.records)
    pdf_bytes = generate_beneficiary_card_pdf(
        patient=patient,
        total_records=len(patient.records),
        total_prescriptions=total_prescriptions,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="beneficiary_card_{beneficiary_id}.pdf"'
        },
    )


@router.get(
    "/profile/{beneficiary_id}",
    response_model=PatientProfileResponse,
)
def get_patient_profile(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([
            ROLE_DOCTOR, ROLE_PATIENT, ROLE_ADMIN,
        ])
    ),
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

    require_patient_access(current_user, patient, CLINICAL_STAFF)

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

        "medical_records": patient.records,
    }


@router.get(
    "/timeline/{beneficiary_id}",
    response_model=PatientTimelineResponse,
)
def patient_timeline(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor"])
    ),
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
                    medicine_name=prescription.medicine.medicine_name,
                )
            )

        medical_records.append(
            TimelineMedicalRecord(
                id=record.id,
                diagnosis=record.diagnosis,
                prescription=record.prescription,
                notes=record.notes,
                prescriptions=prescriptions,
            )
        )

    return {
        "beneficiary_id": patient.beneficiary_id,
        "full_name": patient.full_name,
        "medical_records": medical_records,
    }


# ----------------------------------------------------------
# Catch-all /{beneficiary_id} routes LAST
# ----------------------------------------------------------

@router.get("/{beneficiary_id}", response_model=PatientResponse)
def get_patient(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role([ROLE_DOCTOR, ROLE_REGISTRATION_WORKER, ROLE_PATIENT, ROLE_ADMIN])),
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

    require_patient_access(current_user, patient, DEMOGRAPHIC_STAFF)

    return patient


@router.put(
    "/{beneficiary_id}",
    response_model=PatientResponse,
)
def update_patient(
    beneficiary_id: str,
    updated_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([
            "doctor",
            "registration_worker",
        ])
    ),
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
