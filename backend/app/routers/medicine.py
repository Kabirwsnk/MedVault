from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.medicine import Medicine
from app.schemas.medicine import (
    MedicineCreate,
    MedicineResponse,
    MedicineUpdate
)
from app.utils.roles import require_role

router = APIRouter(
    prefix="/medicines",
    tags=["Medicines"]
)


# ----------------------------------------
# Add Medicine
# ----------------------------------------
@router.post(
    "/",
    response_model=MedicineResponse
)
def add_medicine(
    medicine: MedicineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["pharmacy"])
    )
):

    existing = (
        db.query(Medicine)
        .filter(
            Medicine.medicine_name == medicine.medicine_name
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Medicine already exists."
        )

    new_medicine = Medicine(
        medicine_name=medicine.medicine_name,
        manufacturer=medicine.manufacturer,
        unit=medicine.unit,
        stock=medicine.stock
    )

    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)

    return new_medicine


# ----------------------------------------
# Get All Medicines
# ----------------------------------------
@router.get(
    "/",
    response_model=list[MedicineResponse]
)
def get_all_medicines(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor", "pharmacy"])
    )
):

    return db.query(Medicine).all()

# ----------------------------------------
# Low Stock Medicines
# ----------------------------------------
@router.get(
    "/low-stock",
    response_model=list[MedicineResponse]
)
def low_stock_medicines(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor", "pharmacy"])
    )
):

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.stock < 10
        )
        .all()
    )

    return medicines


# ----------------------------------------
# Get Single Medicine
# ----------------------------------------
@router.get(
    "/{medicine_id}",
    response_model=MedicineResponse
)
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["doctor", "pharmacy"])
    )
):

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found."
        )

    return medicine

# ----------------------------------------
# Update Medicine
# ----------------------------------------
@router.put(
    "/{medicine_id}",
    response_model=MedicineResponse
)
def update_medicine(
    medicine_id: int,
    updated_data: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["pharmacy"])
    )
):

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == medicine_id
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found."
        )

    medicine.manufacturer = updated_data.manufacturer
    medicine.unit = updated_data.unit
    medicine.stock = updated_data.stock

    db.commit()
    db.refresh(medicine)

    return medicine

