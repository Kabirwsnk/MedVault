from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_async_db

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
async def dashboard_stats(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    # Independent aggregate queries keep this read model simple and non-blocking.
    total_patients = (await db.execute(select(func.count()).select_from(Patient))).scalar_one()
    total_medical_records = (await db.execute(select(func.count()).select_from(MedicalRecord))).scalar_one()
    total_prescriptions = (await db.execute(select(func.count()).select_from(Prescription))).scalar_one()
    total_medicines = (await db.execute(select(func.count()).select_from(Medicine))).scalar_one()

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
async def recent_patients(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    result = await db.execute(select(Patient).order_by(Patient.id.desc()).limit(10))
    patients = result.scalars().all()

    return patients  

@router.get(
    "/recent-records",
    response_model=list[RecentMedicalRecordResponse]
)
async def recent_records(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role(["doctor"])
    )
):

    result = await db.execute(select(MedicalRecord).order_by(MedicalRecord.id.desc()).limit(10))
    records = result.scalars().all()

    return records  