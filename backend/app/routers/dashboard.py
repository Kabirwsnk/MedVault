from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db

from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.medicine import Medicine

from app.schemas.dashboard import (
    DashboardResponse,
    RecentPatientResponse,
    RecentMedicalRecordResponse
)

from app.utils.roles import require_role


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get(
    "/stats",
    response_model=DashboardResponse
)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    total_patients = (
        db.query(Patient)
        .count()
    )

    total_medical_records = (
        db.query(MedicalRecord)
        .count()
    )

    total_prescriptions = (
        db.query(Prescription)
        .count()
    )

    total_medicines = (
        db.query(Medicine)
        .count()
    )

    return {
        "total_patients": total_patients,
        "total_medical_records": total_medical_records,
        "total_prescriptions": total_prescriptions,
        "total_medicines": total_medicines
    }
    
@router.get(
    "/recent-patients",
    response_model=list[RecentPatientResponse]
)
def recent_patients(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    patients = (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .limit(10)
        .all()
    )

    return patients  

@router.get(
    "/recent-records",
    response_model=list[RecentMedicalRecordResponse]
)
def recent_records(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    records = (
        db.query(MedicalRecord)
        .order_by(MedicalRecord.id.desc())
        .limit(10)
        .all()
    )

    return records  