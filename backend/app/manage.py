"""Management helpers for ad-hoc operational tasks.

Run as a module: `python -m app.manage create-admin --email ... --password ...`
"""
from __future__ import annotations

import sys
from argparse import ArgumentParser

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.utils.security import hash_password


def create_admin(email: str, password: str) -> bool:
    """Idempotently create an initial admin user.

    Returns True when an admin was created, False when no action was needed
    because an admin already exists.
    """
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.role == "admin").first()
        if existing_admin:
            print("Admin user already exists; no action taken.")
            return False

        if db.query(User).filter(User.email == email).first():
            raise RuntimeError(f"A user with email {email} already exists")

        admin = User(email=email, password=hash_password(password), role="admin", is_active=True)
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Created admin user: {email}")
        return True
    finally:
        db.close()


def seed_demo(ensure_tables: bool = False) -> bool:
    """Idempotently seed demo accounts, medicines, and a sample patient for live demo deployments."""
    if ensure_tables:
        Base.metadata.create_all(engine)

    from datetime import date
    from app.models.medicine import Medicine
    from app.models.patient import Patient

    db = SessionLocal()
    try:
        users = [
            ("admin@local.test", "AdminSecurePassword123!", "admin"),
            ("doctor@medvault.test", "DoctorSecurePassword123!", "doctor"),
            ("pharmacy@medvault.test", "PharmacySecurePassword123!", "pharmacy"),
            ("worker@medvault.test", "WorkerSecurePassword123!", "registration_worker"),
        ]
        for email, password, role in users:
            if not db.query(User).filter(User.email == email).first():
                user = User(email=email, password=hash_password(password), role=role, is_active=True)
                db.add(user)
                print(f"Created demo user: {email} ({role})")

        if db.query(Medicine).count() == 0:
            medicines = [
                Medicine(medicine_name="Amoxicillin 500mg", manufacturer="Cipla Ltd", unit="Strip of 10", stock=150),
                Medicine(medicine_name="Paracetamol 650mg", manufacturer="Micro Labs", unit="Strip of 15", stock=200),
                Medicine(medicine_name="Metformin 500mg", manufacturer="Sun Pharma", unit="Strip of 10", stock=85),
                Medicine(medicine_name="Azithromycin 250mg", manufacturer="Lupin", unit="Strip of 6", stock=40),
                Medicine(medicine_name="Omeprazole 20mg", manufacturer="Dr. Reddy's", unit="Strip of 14", stock=120),
                Medicine(medicine_name="Cetirizine 10mg", manufacturer="Alkem", unit="Strip of 10", stock=15),
                Medicine(medicine_name="Atorvastatin 10mg", manufacturer="Zydus", unit="Strip of 10", stock=8),
            ]
            db.add_all(medicines)
            print(f"Seeded {len(medicines)} essential medicines.")

        if db.query(Patient).count() == 0:
            patient = Patient(
                beneficiary_id="MV260001",
                full_name="Aarav Sharma",
                date_of_birth=date(1988, 6, 15),
                gender="Male",
                phone_number="+91 98765 43210",
                aadhar_number="123456789012",
                emergency_contact="Priya Sharma (+91 98765 43211)",
                blood_group="B+",
                height_cm=175,
                weight_kg=72,
            )
            db.add(patient)
            print("Seeded sample patient: Aarav Sharma (MV260001)")

        db.commit()
        print("Demo seed completed successfully.")
        return True
    finally:
        db.close()


def main(argv: list[str] | None = None) -> int:
    parser = ArgumentParser(prog="app.manage")
    subs = parser.add_subparsers(dest="command")

    p_create = subs.add_parser("create-admin", help="Create initial admin user")
    p_create.add_argument("--email", required=True, help="Admin email address")
    p_create.add_argument("--password", required=True, help="Admin password")
    p_create.add_argument(
        "--ensure-tables",
        action="store_true",
        help="Create database tables before attempting to create the admin",
    )

    p_seed = subs.add_parser("seed-demo", help="Seed default demo accounts, medicines, and sample patient")
    p_seed.add_argument(
        "--ensure-tables",
        action="store_true",
        help="Create database tables before attempting to seed data",
    )

    args = parser.parse_args(argv)

    if args.command == "create-admin":
        if args.ensure_tables:
            Base.metadata.create_all(engine)
        try:
            created = create_admin(args.email, args.password)
            return 0 if created or not created else 0
        except Exception as exc:  # pragma: no cover - surface errors to operator
            print("Error creating admin:", exc, file=sys.stderr)
            return 2

    if args.command == "seed-demo":
        try:
            seed_demo(ensure_tables=args.ensure_tables)
            return 0
        except Exception as exc:  # pragma: no cover
            print("Error seeding demo data:", exc, file=sys.stderr)
            return 2

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
