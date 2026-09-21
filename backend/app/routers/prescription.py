from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_async_db
from app.models.medical_record import MedicalRecord
from app.models.medicine import Medicine
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services.inventory import dispense_prescription as dispense
from app.utils.roles import ROLE_DOCTOR, ROLE_PHARMACY, require_role

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post("/{medical_record_id}", response_model=PrescriptionResponse, status_code=201)
async def create_prescription(
    medical_record_id: int,
    payload: PrescriptionCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(require_role([ROLE_DOCTOR])),
):
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == medical_record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")
    result = await db.execute(
        select(Medicine).where(Medicine.id == payload.medicine_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Medicine not found.")
    prescription = Prescription(medical_record_id=record.id, **payload.model_dump())
    db.add(prescription)
    await db.commit()
    await db.refresh(prescription)
    return prescription


@router.get("/dispensed/history", response_model=list[PrescriptionResponse])
async def dispensing_history(db: AsyncSession = Depends(get_async_db), current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PHARMACY]))):
    result = await db.execute(
        select(Prescription)
        .where(Prescription.dispensed.is_(True))
        .order_by(Prescription.dispensed_at.desc())
    )
    return result.scalars().all()


@router.get("/details/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(prescription_id: int, db: AsyncSession = Depends(get_async_db), current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PHARMACY]))):
    result = await db.execute(
        select(Prescription).where(Prescription.id == prescription_id)
    )
    prescription = result.scalar_one_or_none()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    return prescription


@router.get("/", response_model=list[PrescriptionResponse])
async def get_all_prescriptions(db: AsyncSession = Depends(get_async_db), current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PHARMACY]))):
    result = await db.execute(select(Prescription))
    return result.scalars().all()


@router.post("/{prescription_id}/dispense", response_model=PrescriptionResponse)
async def dispense_prescription(prescription_id: int, db: AsyncSession = Depends(get_async_db), current_user=Depends(require_role([ROLE_PHARMACY]))):
    # Keep stock mutation and its audit row inside one awaited transaction.
    return await dispense(db, prescription_id, current_user.id)
