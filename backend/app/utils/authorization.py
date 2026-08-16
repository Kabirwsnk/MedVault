from fastapi import HTTPException, status

from app.models.patient import Patient
from app.utils.roles import ROLE_ADMIN, ROLE_DOCTOR, ROLE_REGISTRATION_WORKER, ROLE_PATIENT

CLINICAL_STAFF = {ROLE_DOCTOR}
DEMOGRAPHIC_STAFF = {ROLE_DOCTOR, ROLE_REGISTRATION_WORKER}


def require_patient_access(current_user, patient: Patient, allowed_staff: set[str]) -> Patient:
    """Object-level authorization for PHI-bearing patient resources."""
    if current_user.role in allowed_staff or current_user.role == ROLE_ADMIN:
        return patient
    if current_user.role == ROLE_PATIENT and current_user.patient and current_user.patient.id == patient.id:
        return patient
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not authorized to access this patient's data.",
    )
