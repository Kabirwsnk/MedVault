from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db
from app.models.patient import Patient
from app.utils.roles import require_role

from sqlalchemy import func
from app.models.medical_record import MedicalRecord

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/doctor/stats")
def doctor_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["doctor"]))
):

    total_patients = db.query(Patient).count()

    total_records = db.query(MedicalRecord).count()

    latest_patient = (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .first()
    )

    latest_record = (
        db.query(MedicalRecord)
        .order_by(MedicalRecord.id.desc())
        .first()
    )

    return {
        "total_patients": total_patients,
        "total_medical_records": total_records,
        "latest_registered_patient": (
            latest_patient.full_name
            if latest_patient
            else None
        ),
        "latest_record_id": (
            latest_record.id
            if latest_record
            else None
        )
    }    


@router.get("/doctor/{beneficiary_id}")
def doctor_dashboard(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["doctor"]))
):

    patient = (
        db.query(Patient)
        .options(joinedload(Patient.records))
        .filter(Patient.beneficiary_id == beneficiary_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found."
        )

    records = patient.records

    latest_visit = None

    if records:
        latest_visit = records[-1]

    return {
        "patient": {
            "beneficiary_id": patient.beneficiary_id,
            "full_name": patient.full_name,
            "phone_number": patient.phone_number
        },
        "total_visits": len(records),
        "latest_visit": latest_visit,
        "medical_history": records
    }
    
