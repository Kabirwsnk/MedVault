from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_async_db
from app.models.patient import Patient
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me")
async def get_me(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    beneficiary_id = None
    if current_user.role == "patient":
        result = await db.execute(select(Patient.beneficiary_id).where(Patient.user_id == current_user.id))
        beneficiary_id = result.scalar_one_or_none()

    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "beneficiary_id": beneficiary_id,
    }