"""Executable regression checks for the highest-risk MedVault workflows."""
import os
import tempfile
import unittest

TEST_DB = os.path.join(tempfile.gettempdir(), "medvault_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["JWT_SECRET_KEY"] = "test-secret-not-for-production"

from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models.inventory_movement import InventoryMovement
from app.models.medical_record import MedicalRecord
from app.models.medicine import Medicine
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.user import User
from app.services.inventory import dispense_prescription
from app.utils.jwt import create_access_token
from app.utils.security import hash_password


class SecurityAndDispensingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(engine)

    def setUp(self):
        db = SessionLocal()
        for model in (InventoryMovement, Prescription, MedicalRecord, Medicine, Patient, User):
            db.query(model).delete()
        doctor = User(email="doctor@test.local", password=hash_password("Secure password 123"), role="doctor")
        first_user = User(email="first@test.local", password=hash_password("Secure password 123"), role="patient")
        second_user = User(email="second@test.local", password=hash_password("Secure password 123"), role="patient")
        db.add_all((doctor, first_user, second_user))
        db.flush()
        db.add_all((
            Patient(beneficiary_id="MV260001", full_name="First", phone_number="1234567890", aadhar_number="111111111111", user_id=first_user.id),
            Patient(beneficiary_id="MV260002", full_name="Second", phone_number="1234567891", aadhar_number="222222222222", user_id=second_user.id),
        ))
        db.commit()
        self.db, self.doctor, self.first_user = db, doctor, first_user

    def tearDown(self):
        self.db.close()

    def test_patient_data_is_authenticated_and_object_authorized(self):
        client = TestClient(app)
        patient_headers = {"Authorization": "Bearer " + create_access_token({"sub": self.first_user.email, "role": "patient"})}
        doctor_headers = {"Authorization": "Bearer " + create_access_token({"sub": self.doctor.email, "role": "doctor"})}
        self.assertEqual(client.get("/patients/").status_code, 401)
        self.assertEqual(client.get("/patients/profile/MV260002", headers=patient_headers).status_code, 403)
        self.assertEqual(client.get("/patients/profile/MV260001", headers=patient_headers).status_code, 200)
        self.assertEqual(client.get("/patients/profile/MV260002", headers=doctor_headers).status_code, 200)

    def test_dispensing_creates_exactly_one_inventory_movement(self):
        pharmacist = User(email="pharmacy@test.local", password=hash_password("Secure password 123"), role="pharmacy")
        patient = self.db.query(Patient).first()
        medicine = Medicine(medicine_name="Demo", manufacturer="Acme", unit="tablet", stock=10)
        self.db.add(pharmacist)
        self.db.add(medicine)
        self.db.flush()
        record = MedicalRecord(patient_id=patient.id, doctor_id=self.doctor.id, diagnosis="Test", prescription="Plan")
        self.db.add(record)
        self.db.flush()
        prescription = Prescription(medical_record_id=record.id, medicine_id=medicine.id, quantity=3, dosage="Daily", duration="3 days")
        self.db.add(prescription)
        self.db.commit()
        dispense_prescription(self.db, prescription.id, pharmacist.id)
        self.db.refresh(medicine)
        self.assertEqual(medicine.stock, 7)
        self.assertEqual(self.db.query(InventoryMovement).count(), 1)


if __name__ == "__main__":
    unittest.main()
