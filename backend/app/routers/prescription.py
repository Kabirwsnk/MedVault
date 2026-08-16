from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.medical_record import MedicalRecord
from app.models.medicine import Medicine
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services.inventory import dispense_prescription as dispense
from app.utils.roles import ROLE_DOCTOR, ROLE_PHARMACY, require_role

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post("/{medical_record_id}", response_model=PrescriptionResponse, status_code=201)
def create_prescription(
    medical_record_id: int,
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role([ROLE_DOCTOR])),
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == medical_record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")
    if not db.query(Medicine).filter(Medicine.id == payload.medicine_id).first():
        raise HTTPException(status_code=404, detail="Medicine not found.")
    prescription = Prescription(medical_record_id=record.id, **payload.model_dump())
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


@router.get("/dispensed/history", response_model=list[PrescriptionResponse])
def dispensing_history(db: Session = Depends(get_db), current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PHARMACY]))):
    return db.query(Prescription).filter(Prescription.dispensed.is_(True)).order_by(Prescription.dispensed_at.desc()).all()


@router.get("/details/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(prescription_id: int, db: Session = Depends(get_db), current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PHARMACY]))):
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    return prescription


@router.get("/", response_model=list[PrescriptionResponse])
def get_all_prescriptions(db: Session = Depends(get_db), current_user=Depends(require_role([ROLE_DOCTOR, ROLE_PHARMACY]))):
    return db.query(Prescription).all()


@router.post("/{prescription_id}/dispense", response_model=PrescriptionResponse)
def dispense_prescription(prescription_id: int, db: Session = Depends(get_db), current_user=Depends(require_role([ROLE_PHARMACY]))):
    return dispense(db, prescription_id, current_user.id)
