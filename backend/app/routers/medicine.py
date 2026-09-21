from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.config import CRITICAL_STOCK_THRESHOLD, LOW_STOCK_THRESHOLD
from app.dependencies import get_async_db
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
async def add_medicine(
    medicine: MedicineCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    result = await db.execute(
        select(Medicine).where(Medicine.medicine_name == medicine.medicine_name)
    )
    existing = result.scalar_one_or_none()

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
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Medicine already exists.")
    await db.refresh(new_medicine)

    return new_medicine


# ----------------------------------------
# Get All Medicines
# ----------------------------------------
@router.get(
    "/",
    response_model=list[MedicineResponse]
)
async def get_all_medicines(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_DOCTOR, ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    result = await db.execute(select(Medicine))
    return result.scalars().all()


# ----------------------------------------
# Low Stock Medicines
# ----------------------------------------
@router.get(
    "/low-stock",
    response_model=list[MedicineResponse]
)
async def low_stock_medicines(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_DOCTOR, ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    result = await db.execute(
        select(Medicine).where(Medicine.stock < LOW_STOCK_THRESHOLD)
    )
    medicines = result.scalars().all()

    return medicines


# ----------------------------------------
# Critical Stock Medicines
# ----------------------------------------
@router.get(
    "/critical-stock",
    response_model=list[MedicineResponse]
)
async def critical_stock_medicines(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    result = await db.execute(
        select(Medicine).where(Medicine.stock < CRITICAL_STOCK_THRESHOLD)
    )
    medicines = result.scalars().all()

    return medicines


# ----------------------------------------
# Inventory Movement Audit History
# ----------------------------------------
@router.get(
    "/movements/history",
    response_model=list[InventoryMovementResponse]
)
async def inventory_movements_history(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_DOCTOR, ROLE_ADMIN])
    ),
):
    result = await db.execute(
        select(InventoryMovement).order_by(InventoryMovement.created_at.desc())
    )
    movements = result.scalars().all()
    return movements


# ----------------------------------------
# Restock Medicine
# ----------------------------------------
@router.put(
    "/{medicine_id}/restock",
    response_model=MedicineResponse
)
async def restock_medicine(
    medicine_id: int,
    restock: MedicineRestock,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    result = await db.execute(
        select(Medicine).where(Medicine.id == medicine_id).with_for_update()
    )
    medicine = result.scalar_one_or_none()

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

    await db.commit()
    await db.refresh(medicine)

    return medicine


# ----------------------------------------
# Get Single Medicine
# ----------------------------------------
@router.get(
    "/{medicine_id}",
    response_model=MedicineResponse
)
async def get_medicine(
    medicine_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_DOCTOR, ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    result = await db.execute(select(Medicine).where(Medicine.id == medicine_id))
    medicine = result.scalar_one_or_none()

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
async def update_medicine(
    medicine_id: int,
    updated_data: MedicineUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY, ROLE_ADMIN])
    ),
):
    result = await db.execute(select(Medicine).where(Medicine.id == medicine_id))
    medicine = result.scalar_one_or_none()

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

    await db.commit()
    await db.refresh(medicine)

    return medicine
