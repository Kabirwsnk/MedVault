from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db

from app.models.prescription import Prescription
from app.models.medical_record import MedicalRecord
from app.models.medicine import Medicine

from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse
)

from app.utils.roles import require_role

router = APIRouter(
    prefix="/prescriptions",
    tags=["Prescriptions"]
)

#create prescription endpoint
@router.post(
    "/{medical_record_id}",
    response_model=PrescriptionResponse
)
def create_prescription(
    medical_record_id: int,
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["doctor"]))
):

    medical_record = (
        db.query(MedicalRecord)
        .filter(
            MedicalRecord.id == medical_record_id
        )
        .first()
    )

    if not medical_record:
        raise HTTPException(
            status_code=404,
            detail="Medical record not found."
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

    new_prescription = Prescription(
        medical_record_id=medical_record.id,
        medicine_id=prescription.medicine_id,
        quantity=prescription.quantity,
        dosage=prescription.dosage,
        duration=prescription.duration
    )

    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return new_prescription