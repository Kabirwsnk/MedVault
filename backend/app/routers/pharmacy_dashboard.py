from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import LOW_STOCK_THRESHOLD
from app.dependencies import get_async_db
from app.models.medicine import Medicine
from app.models.prescription import Prescription
from app.schemas.pharmacy_dashboard import PharmacyDashboardResponse
from app.utils.roles import ROLE_PHARMACY, require_role

router = APIRouter(
    prefix="/pharmacy-dashboard",
    tags=["Pharmacy Dashboard"]
)


@router.get(
    "/stats",
    response_model=PharmacyDashboardResponse
)
async def pharmacy_dashboard_stats(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role([ROLE_PHARMACY])
    )
):
    # Dashboard reads use async aggregates so reporting traffic does not block API workers.
    total_medicines = (await db.execute(select(func.count()).select_from(Medicine))).scalar_one()
    total_prescriptions = (await db.execute(select(func.count()).select_from(Prescription))).scalar_one()
    pending_prescriptions = (
        await db.execute(
            select(func.count()).select_from(Prescription).where(Prescription.dispensed.is_(False))
        )
    ).scalar_one()
    dispensed_prescriptions = (
        await db.execute(
            select(func.count()).select_from(Prescription).where(Prescription.dispensed.is_(True))
        )
    ).scalar_one()
    low_stock_medicines = (
        await db.execute(
            select(func.count()).select_from(Medicine).where(Medicine.stock < LOW_STOCK_THRESHOLD)
        )
    ).scalar_one()

    return {
        "total_medicines": total_medicines,
        "total_prescriptions": total_prescriptions,
        "pending_prescriptions": pending_prescriptions,
        "dispensed_prescriptions": dispensed_prescriptions,
        "low_stock_medicines": low_stock_medicines,
    }