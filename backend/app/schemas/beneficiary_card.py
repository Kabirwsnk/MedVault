from pydantic import BaseModel


class BeneficiaryCardResponse(BaseModel):

    beneficiary_id: str

    full_name: str

    phone_number: str

    blood_group: str | None = None

    date_of_birth: str | None = None

    gender: str | None = None

    emergency_contact: str | None = None

    total_medical_records: int

    total_prescriptions: int