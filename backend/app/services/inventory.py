from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory_movement import InventoryMovement
from app.models.medicine import Medicine
from app.models.prescription import Prescription


async def dispense_prescription(db: AsyncSession, prescription_id: int, pharmacist_id: int) -> Prescription:
    """Atomically dispense once and record the corresponding stock movement."""
    result = await db.execute(
        select(Prescription)
        .where(Prescription.id == prescription_id)
        .with_for_update()
    )
    prescription = result.scalar_one_or_none()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    if prescription.dispensed:
        raise HTTPException(status_code=409, detail="Prescription already dispensed.")
    result = await db.execute(
        select(Medicine)
        .where(Medicine.id == prescription.medicine_id)
        .with_for_update()
    )
    medicine = result.scalar_one_or_none()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")
    if medicine.stock < prescription.quantity:
        raise HTTPException(status_code=409, detail="Insufficient stock.")

    stock_before = medicine.stock
    medicine.stock -= prescription.quantity
    prescription.dispensed = True
    prescription.dispensed_at = datetime.now(timezone.utc)
    prescription.dispensed_by_user_id = pharmacist_id
    db.add(InventoryMovement(
        medicine_id=medicine.id,
        prescription_id=prescription.id,
        performed_by_user_id=pharmacist_id,
        movement_type="dispense",
        quantity=-prescription.quantity,
        stock_before=stock_before,
        stock_after=medicine.stock,
    ))
    await db.commit()
    await db.refresh(prescription)
    return prescription
