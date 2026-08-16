from collections.abc import Iterable

from fastapi import Depends, HTTPException, status

from app.utils.auth import get_current_user


ROLE_ADMIN = "admin"
ROLE_DOCTOR = "doctor"
ROLE_REGISTRATION_WORKER = "registration_worker"
ROLE_PHARMACY = "pharmacy"
ROLE_PATIENT = "patient"
VALID_ROLES = {
    ROLE_ADMIN,
    ROLE_DOCTOR,
    ROLE_REGISTRATION_WORKER,
    ROLE_PHARMACY,
    ROLE_PATIENT,
}


def require_role(allowed_roles: Iterable[str]):

    allowed = frozenset(allowed_roles)

    def role_checker(
        current_user=Depends(get_current_user)
    ):

        if current_user.role not in allowed:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )

        return current_user

    return role_checker
