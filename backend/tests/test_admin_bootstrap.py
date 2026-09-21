"""Test the admin bootstrap management helper."""
import os
import tempfile
import unittest

TEST_DB = os.path.join(tempfile.gettempdir(), "medvault_admin_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["JWT_SECRET_KEY"] = "test-secret-admin"

from fastapi.testclient import TestClient

from app.database import Base, engine, SessionLocal
from app.main import app
from app.models.user import User
from app.manage import create_admin
from app.utils.jwt import create_access_token


class AdminBootstrapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(engine)

    def setUp(self):
        # Clear users table between tests
        db = SessionLocal()
        db.query(User).delete()
        db.commit()
        db.close()

    def test_create_admin_and_use_admin_token(self):
        # Create admin
        created = create_admin("admin@local.test", "StrongPass123")
        self.assertTrue(created)

        # Verify admin exists in DB
        db = SessionLocal()
        admin = db.query(User).filter(User.role == "admin").first()
        self.assertIsNotNone(admin)
        self.assertEqual(admin.email, "admin@local.test")

        # Use admin token to call admin-only endpoint
        token = create_access_token({"sub": admin.email, "role": admin.role})
        client = TestClient(app)
        headers = {"Authorization": f"Bearer {token}"}

        res = client.post("/auth/register", json={"email": "staff@example.com", "password": "P@ssword12345", "role": "doctor"}, headers=headers)
        self.assertEqual(res.status_code, 201)

        db.close()

    def test_login_is_rate_limited(self):
        client = TestClient(app)

        # Limit repeated credential attempts before password verification becomes expensive.
        responses = [
            client.post(
                "/auth/login",
                data={"username": "unknown@example.com", "password": "wrong-password"},
            )
            for _ in range(6)
        ]

        self.assertEqual([response.status_code for response in responses[:5]], [401] * 5)
        self.assertEqual(responses[5].status_code, 429)


if __name__ == "__main__":
    unittest.main()
