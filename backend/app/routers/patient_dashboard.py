from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_async_db

from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription

from app.schemas.patient_dashboard import (
    PatientDashboardResponse,
    PatientMedicalRecordResponse,
    PatientPrescriptionResponse
)

from app.utils.roles import require_role


router = APIRouter(
    prefix="/patient-dashboard",
    tags=["Patient Dashboard"]
)


@router.get(
    "/{beneficiary_id}",
    response_model=PatientDashboardResponse
)
async def get_patient_dashboard(
    beneficiary_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(
        require_role(["patient"])
    )
):

    result = await db.execute(
        select(Patient)
        .options(
            selectinload(Patient.records)
            .selectinload(MedicalRecord.prescriptions)
            .selectinload(Prescription.medicine)
        )
        .where(Patient.beneficiary_id == beneficiary_id)
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    if not current_user.patient or current_user.patient.id != patient.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this patient's data"
        )

    medical_records = []

    for record in patient.records:

        prescriptions = []

        for prescription in record.prescriptions:

            prescriptions.append(
                PatientPrescriptionResponse(
                    id=prescription.id,
                    medicine_name=(
                        prescription.medicine.medicine_name
                    ),
                    quantity=prescription.quantity,
                    dosage=prescription.dosage,
                    duration=prescription.duration,
                    dispensed=prescription.dispensed,
                    dispensed_at=prescription.dispensed_at
                )
            )

        medical_records.append(
            PatientMedicalRecordResponse(
                id=record.id,
                diagnosis=record.diagnosis,
                prescription=record.prescription,
                notes=record.notes,
                prescriptions=prescriptions
            )
        )

    return PatientDashboardResponse(
        beneficiary_id=patient.beneficiary_id,
        full_name=patient.full_name,
        phone_number=patient.phone_number,
        blood_group=patient.blood_group,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        height_cm=patient.height_cm,
        weight_kg=patient.weight_kg,
        emergency_contact=patient.emergency_contact,
        medical_records=medical_records
    )