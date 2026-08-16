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
        other_doctor = User(email="other_doc@test.local", password=hash_password("Secure password 123"), role="doctor")
        pharmacist = User(email="pharmacy@test.local", password=hash_password("Secure password 123"), role="pharmacy")
        first_user = User(email="first@test.local", password=hash_password("Secure password 123"), role="patient")
        second_user = User(email="second@test.local", password=hash_password("Secure password 123"), role="patient")
        db.add_all((doctor, other_doctor, pharmacist, first_user, second_user))
        db.flush()
        db.add_all((
            Patient(beneficiary_id="MV260001", full_name="First", phone_number="1234567890", aadhar_number="111111111111", user_id=first_user.id),
            Patient(beneficiary_id="MV260002", full_name="Second", phone_number="1234567891", aadhar_number="222222222222", user_id=second_user.id),
        ))
        db.commit()
        self.db, self.doctor, self.other_doctor, self.pharmacist, self.first_user = db, doctor, other_doctor, pharmacist, first_user

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
        patient = self.db.query(Patient).first()
        medicine = Medicine(medicine_name="Demo", manufacturer="Acme", unit="tablet", stock=10)
        self.db.add(medicine)
        self.db.flush()
        record = MedicalRecord(patient_id=patient.id, doctor_id=self.doctor.id, diagnosis="Test", prescription="Plan")
        self.db.add(record)
        self.db.flush()
        prescription = Prescription(medical_record_id=record.id, medicine_id=medicine.id, quantity=3, dosage="Daily", duration="3 days")
        self.db.add(prescription)
        self.db.commit()
        dispense_prescription(self.db, prescription.id, self.pharmacist.id)
        self.db.refresh(medicine)
        self.assertEqual(medicine.stock, 7)
        self.assertEqual(self.db.query(InventoryMovement).count(), 1)

    def test_medical_record_authorship_enforcement(self):
        client = TestClient(app)
        patient = self.db.query(Patient).first()
        record = MedicalRecord(patient_id=patient.id, doctor_id=self.doctor.id, diagnosis="Original", prescription="Original Rx")
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        other_doctor_headers = {"Authorization": "Bearer " + create_access_token({"sub": self.other_doctor.email, "role": "doctor"})}
        author_headers = {"Authorization": "Bearer " + create_access_token({"sub": self.doctor.email, "role": "doctor"})}

        # Other doctor attempting edit should be forbidden
        response = client.put(
            f"/medical-records/{record.id}",
            json={"diagnosis": "Hacked", "prescription": "Hacked Rx", "notes": "Unauthorized edit"},
            headers=other_doctor_headers,
        )
        self.assertEqual(response.status_code, 403)

        # Authoring doctor should succeed
        response = client.put(
            f"/medical-records/{record.id}",
            json={"diagnosis": "Updated", "prescription": "Updated Rx", "notes": "Legitimate edit"},
            headers=author_headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["diagnosis"], "Updated")

    def test_ai_router_endpoints(self):
        client = TestClient(app)
        doctor_headers = {"Authorization": "Bearer " + create_access_token({"sub": self.doctor.email, "role": "doctor"})}
        res_home = client.get("/ai/")
        self.assertEqual(res_home.status_code, 200)
        self.assertIn("message", res_home.json())

        res_symptom = client.get("/ai/symptom-checker?symptoms=fever%20and%20cough", headers=doctor_headers)
        self.assertEqual(res_symptom.status_code, 200)
        self.assertEqual(res_symptom.json().get("possible_condition"), "Flu")

        res_summary = client.get("/ai/summary/MV260001", headers=doctor_headers)
        self.assertEqual(res_summary.status_code, 200)
        self.assertIn("summary", res_summary.json())
        self.assertEqual(res_summary.json()["beneficiary_id"], "MV260001")

    def test_inventory_movements_history(self):
        client = TestClient(app)
        pharmacy_headers = {"Authorization": "Bearer " + create_access_token({"sub": self.pharmacist.email, "role": "pharmacy"})}
        medicine = Medicine(medicine_name="AuditMed", manufacturer="PharmaCorp", unit="capsule", stock=50)
        self.db.add(medicine)
        self.db.commit()

        # Restock creates a movement
        client.put(f"/medicines/{medicine.id}/restock", json={"quantity": 25}, headers=pharmacy_headers)

    def test_beneficiary_card_qr_and_pdf(self):
        client = TestClient(app)
        doctor_headers = {"Authorization": "Bearer " + create_access_token({"sub": self.doctor.email, "role": "doctor"})}

        # QR code endpoint
        res_qr = client.get("/patients/card/MV260001/qr", headers=doctor_headers)
        self.assertEqual(res_qr.status_code, 200)
        self.assertEqual(res_qr.headers["content-type"], "image/png")
        self.assertGreater(len(res_qr.content), 100)

        # PDF card endpoint
        res_pdf = client.get("/patients/card/MV260001/pdf", headers=doctor_headers)
        self.assertEqual(res_pdf.status_code, 200)
        self.assertEqual(res_pdf.headers["content-type"], "application/pdf")
        self.assertGreater(len(res_pdf.content), 500)


if __name__ == "__main__":
    unittest.main()
