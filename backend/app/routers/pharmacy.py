"""Legacy pharmacy routes retained temporarily for existing clients.

New clients should use /prescriptions/{prescription_id}/dispense.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.prescription import PrescriptionResponse
from app.services.inventory import dispense_prescription
from app.utils.roles import ROLE_PHARMACY, require_role

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy"])


@router.post("/dispense/{prescription_id}", response_model=PrescriptionResponse, deprecated=True)
def legacy_dispense_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role([ROLE_PHARMACY])),
):
    return dispense_prescription(db, prescription_id, current_user.id)
