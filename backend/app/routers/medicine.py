from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import CRITICAL_STOCK_THRESHOLD, LOW_STOCK_THRESHOLD
from app.dependencies import get_db
from app.models.inventory_movement import InventoryMovement
from app.models.medicine import Medicine
from app.schemas.medicine import (
    InventoryMovementResponse,
    MedicineCreate,
    MedicineResponse,
    MedicineRestock,
    MedicineUpdate,
)
from app.utils.roles import (
    ROLE_ADMIN,
    ROLE_DOCTOR,
    ROLE_PHARMACY,
    require_role,
)

router = APIRouter(
    prefix="/medicines",
    tags=["Medicines"]
)


# ----------------------------------------
# Add Medicine
# ----------------------------------------
@router.post(
    "/",
    response_model=MedicineResponse,
    status_code=201,
)
def add_medicine(
    medicine: MedicineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_ADMIN])
    ),
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
        require_role([ROLE_DOCTOR, ROLE_PHARMACY, ROLE_ADMIN])
    ),
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
        require_role([ROLE_DOCTOR, ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.stock < LOW_STOCK_THRESHOLD
        )
        .all()
    )

    return medicines


# ----------------------------------------
# Critical Stock Medicines
# ----------------------------------------
@router.get(
    "/critical-stock",
    response_model=list[MedicineResponse]
)
def critical_stock_medicines(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.stock < CRITICAL_STOCK_THRESHOLD
        )
        .all()
    )

    return medicines


# ----------------------------------------
# Inventory Movement Audit History
# ----------------------------------------
@router.get(
    "/movements/history",
    response_model=list[InventoryMovementResponse]
)
def inventory_movements_history(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_DOCTOR, ROLE_ADMIN])
    ),
):
    movements = (
        db.query(InventoryMovement)
        .order_by(InventoryMovement.created_at.desc())
        .all()
    )
    return movements


# ----------------------------------------
# Restock Medicine
# ----------------------------------------
@router.put(
    "/{medicine_id}/restock",
    response_model=MedicineResponse
)
def restock_medicine(
    medicine_id: int,
    restock: MedicineRestock,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).with_for_update().first()

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found."
        )

    stock_before = medicine.stock
    medicine.stock += restock.quantity
    db.add(InventoryMovement(
        medicine_id=medicine.id,
        performed_by_user_id=current_user.id,
        movement_type="restock",
        quantity=restock.quantity,
        stock_before=stock_before,
        stock_after=medicine.stock,
    ))

    db.commit()
    db.refresh(medicine)

    return medicine


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
        require_role([ROLE_DOCTOR, ROLE_PHARMACY, ROLE_ADMIN])
    ),
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
        require_role([ROLE_PHARMACY, ROLE_ADMIN])
    ),
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

    stock_before = medicine.stock
    medicine.manufacturer = updated_data.manufacturer
    medicine.unit = updated_data.unit
    medicine.stock = updated_data.stock

    if medicine.stock != stock_before:
        db.add(InventoryMovement(
            medicine_id=medicine.id,
            performed_by_user_id=current_user.id,
            movement_type="adjustment",
            quantity=medicine.stock - stock_before,
            stock_before=stock_before,
            stock_after=medicine.stock,
            notes="Catalog stock update",
        ))

    db.commit()
    db.refresh(medicine)

    return medicine
