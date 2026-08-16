from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.user import PatientEnrollment, UserCreate, UserResponse
from app.utils.jwt import create_access_token
from app.utils.roles import ROLE_ADMIN, ROLE_PATIENT, VALID_ROLES, require_role
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_staff_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role([ROLE_ADMIN])),
):
    if user.role not in VALID_ROLES or user.role == ROLE_PATIENT:
        raise HTTPException(status_code=422, detail="Invalid staff role")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    new_user = User(email=user.email, password=hash_password(user.password), role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/patient-enrollment", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def enroll_patient(payload: PatientEnrollment, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.beneficiary_id == payload.beneficiary_id).first()
    if not patient or patient.user_id is not None:
        raise HTTPException(status_code=400, detail="Patient account cannot be enrolled")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=payload.email, password=hash_password(payload.password), role=ROLE_PATIENT)
    db.add(user)
    db.flush()
    patient.user_id = user.id
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.is_active or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {
        "access_token": create_access_token({"sub": user.email, "role": user.role}),
        "token_type": "bearer",
    }
