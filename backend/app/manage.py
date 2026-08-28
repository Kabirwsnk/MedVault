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

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
