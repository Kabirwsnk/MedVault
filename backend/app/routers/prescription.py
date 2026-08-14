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

from datetime import datetime

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

@router.get(
    "/details/{prescription_id}",
    response_model=PrescriptionResponse
)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor", "pharmacy"])
    )
):

    prescription = (
        db.query(Prescription)
        .filter(
            Prescription.id == prescription_id
        )
        .first()
    )

    if not prescription:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found."
        )

    return prescription

@router.get(
    "/",
    response_model=list[PrescriptionResponse]
)
def get_all_prescriptions(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor", "pharmacy"])
    )
):

    return db.query(Prescription).all()

@router.post(
    "/{prescription_id}/dispense",
    response_model=PrescriptionResponse
)
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
            Prescription.id == prescription_id
        )
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
            detail="Prescription already dispensed."
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
            detail="Insufficient stock."
        )

    medicine.stock -= prescription.quantity

    prescription.dispensed = True
    prescription.dispensed_at = datetime.utcnow()

    db.commit()

    db.refresh(prescription)

    return prescription