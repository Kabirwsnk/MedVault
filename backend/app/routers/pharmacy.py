from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.dependencies import get_db
from app.models.prescription import Prescription
from app.models.medicine import Medicine
from app.utils.roles import require_role

router = APIRouter(
    prefix="/pharmacy",
    tags=["Pharmacy"]
)

@router.post("/dispense/{prescription_id}")
def dispense_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["pharmacy"])
    )
):
    prescription = (
        db.query(Prescription)
        .filter(
            Prescription.id == prescription_id)
        .first()
    )

    if not prescription:
        raise HTTPException(
            status_code=404, 
            detail="Prescription not found."
            )

    if prescription.dispensed:
        raise HTTPException(
            status_code=400,
            detail="Prescription has already been dispensed."
            )

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == prescription.medicine_id
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404, 
            detail="Medicine not found."
        )

    if medicine.stock < prescription.quantity:
        raise HTTPException(
        status_code=400,
        detail="Insufficient medicine stock."
    )

    medicine.stock -= prescription.quantity

    prescription.dispensed = True
    prescription.dispensed_at = datetime.now(UTC)

    db.commit()

    return {
    "message": "Prescription dispensed successfully.",
    "medicine": medicine.medicine_name,
    "quantity_dispensed": prescription.quantity,
    "remaining_stock": medicine.stock
}