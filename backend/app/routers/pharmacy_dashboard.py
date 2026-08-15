from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db

from app.models.medicine import Medicine
from app.models.prescription import Prescription

from app.schemas.pharmacy_dashboard import PharmacyDashboardResponse

from app.utils.roles import require_role


router = APIRouter(
    prefix="/pharmacy-dashboard",
    tags=["Pharmacy Dashboard"]
)


@router.get(
    "/stats",
    response_model=PharmacyDashboardResponse
)
def pharmacy_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["pharmacy"])
    )
):

    total_medicines = (
        db.query(Medicine)
        .count()
    )

    total_prescriptions = (
        db.query(Prescription)
        .count()
    )

    pending_prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.dispensed == False
        )
        .count()
    )

    dispensed_prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.dispensed == True
        )
        .count()
    )

    low_stock_medicines = (
        db.query(Medicine)
        .filter(
            Medicine.stock < 10
        )
        .count()
    )

    return {
        "total_medicines": total_medicines,
        "total_prescriptions": total_prescriptions,
        "pending_prescriptions": pending_prescriptions,
        "dispensed_prescriptions": dispensed_prescriptions,
        "low_stock_medicines": low_stock_medicines
    }