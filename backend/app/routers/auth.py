from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies import get_async_db
from app.config import PROTECT_PATIENT_ENROLLMENT
from app.models.patient import Patient
from app.models.user import User
from app.schemas.user import PatientEnrollment, UserCreate, UserResponse
from app.utils.jwt import create_access_token
from app.utils.roles import ROLE_ADMIN, ROLE_PATIENT, VALID_ROLES, require_role
from app.utils.security import hash_password, verify_password
from app.utils.auth import get_optional_current_user
from app.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_staff_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(require_role([ROLE_ADMIN])),
):
    if user.role not in VALID_ROLES or user.role == ROLE_PATIENT:
        raise HTTPException(status_code=422, detail="Invalid staff role")
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    new_user = User(email=user.email, password=hash_password(user.password), role=user.role)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/patient-enrollment", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def enroll_patient(payload: PatientEnrollment, db: AsyncSession = Depends(get_async_db), current_user=Depends(get_optional_current_user)):
    # Enrollment changes account ownership, so staff authorization is the production default.
    if PROTECT_PATIENT_ENROLLMENT:
        if not current_user or current_user.role not in ("admin", "registration_worker"):
            raise HTTPException(status_code=403, detail="Patient enrollment is disabled; contact an admin to create accounts.")

    result = await db.execute(select(Patient).where(Patient.beneficiary_id == payload.beneficiary_id))
    patient = result.scalar_one_or_none()
    if not patient or patient.user_id is not None:
        raise HTTPException(status_code=400, detail="Patient account cannot be enrolled")
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=payload.email, password=hash_password(payload.password), role=ROLE_PATIENT)
    db.add(user)
    await db.flush()
    patient.user_id = user.id
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not user.is_active or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {
        "access_token": create_access_token({"sub": user.email, "role": user.role}),
        "token_type": "bearer",
    }
