from pydantic import BaseModel


class PharmacyDashboardResponse(BaseModel):

    total_medicines: int

    total_prescriptions: int

    pending_prescriptions: int

    dispensed_prescriptions: int

    low_stock_medicines: int