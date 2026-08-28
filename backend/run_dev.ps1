# Quick dev helper: create admin (if needed) and start the server, then open Swagger
# Usage (PowerShell):
# cd backend
# venv\Scripts\Activate
# .\run_dev.ps1 -AdminEmail admin@example.com -AdminPassword "YourStrongPassword"
param(
    [string]$AdminEmail = "admin@example.com",
    [string]$AdminPassword = "ChangeMe12345",
    [int]$Port = 8000
)

python -m app.manage create-admin --ensure-tables --email $AdminEmail --password $AdminPassword
Start-Process "http://127.0.0.1:$Port/docs"
python -m uvicorn app.main:app --host 127.0.0.1 --port $Port
