# MedVault Deployment Guide: Production & Resume Live Link

This guide walks you through deploying **MedVault** to get a live, working link for your resume and portfolio.

---

## Architecture Overview

| Layer | Recommended Free Tier | Alternative |
|---|---|---|
| **Frontend (SPA)** | [Vercel](https://vercel.com) | [Netlify](https://netlify.com) |
| **Backend API** | [Render](https://render.com) | [Railway](https://railway.app) |
| **Database** | [Neon](https://neon.tech) (Serverless PostgreSQL) | [Supabase](https://supabase.com) / Render PostgreSQL |
| **Redis (Rate Limiting)** | [Upstash](https://upstash.com) (Serverless Redis) | Memory fallback (`memory://`) |

---

## Step 1: Set Up Cloud Database (Neon or Supabase)

### Option A: Neon (Recommended — takes ~1 minute)
1. Go to [neon.tech](https://neon.tech) and sign in with GitHub.
2. Create a new project named `medvault-db`.
3. In the Neon Dashboard, copy the **Connection string**:
   - Select **Connection string** (Pooled or Direct).
   - Format looks like:
     ```text
     postgresql://neondb_owner:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
4. Save this connection string for Step 3.

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) and create a project.
2. Under **Project Settings** > **Database** > **Connection string**, select **URI** (Transaction pooler or Session pooler).
3. Save the connection string for Step 3.

---

## Step 2: Set Up Managed Redis (Upstash)

1. Go to [upstash.com](https://upstash.com) and sign in with GitHub.
2. Click **Create Database**, name it `medvault-redis`.
3. Under the **Details** tab, scroll to **REST / Redis Connection URL**.
4. Copy the `rediss://...` connection URL:
   - Example: `rediss://default:AbCdEf123456@us1-cool-seal-12345.upstash.io:6379`
5. Save this URL for Step 3.
*(Note: If you skip Redis, MedVault automatically falls back to in-memory rate limiting.)*

---

## Step 3: Deploy Backend API (Render)

### Using Render (Recommended)
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** > **Web Service**.
3. Select your repository: `https://github.com/Kabirwsnk/MedVault`.
4. Configure the service:
   - **Name**: `medvault-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `bash start.sh`
   - **Instance Type**: `Free`
5. Click **Advanced** > **Add Environment Variable** and enter:
   | Key | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | *(Your Neon/Supabase connection string from Step 1)* | Required |
   | `JWT_SECRET_KEY` | *(Generate a random 32+ character string)* | Required |
   | `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `120` | Token validity |
   | `PROTECT_PATIENT_ENROLLMENT` | `true` | Role guard |
   | `REDIS_URL` | *(Your Upstash `rediss://...` string or `memory://`)* | Rate limiter |
   | `CORS_ORIGIN_REGEX` | `^https://.*(\.vercel\.app\|\.netlify\.app)$` | Allows Vercel/Netlify |
   | `PYTHON_VERSION` | `3.11.9` | Recommended Python runtime |
6. Click **Create Web Service**.
7. Render will build the image, run database migrations (`alembic upgrade head`), and seed demo data (`python -m app.manage seed-demo`).
8. Once live, copy your backend service URL:
   - Example: `https://medvault-backend.onrender.com`
9. Test the backend health endpoint in your browser:
   - `https://medvault-backend.onrender.com/health`
   - Expected response: `{"status":"ok","database":"connected"}`

---

## Step 4: Deploy Frontend (Vercel)

### Using Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** > **Project**.
3. Import `Kabirwsnk/MedVault`.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `frontend`.
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://medvault-backend.onrender.com` *(Your Render URL from Step 3 without trailing slash)* |
6. Click **Deploy**.
7. In ~60 seconds, your site will be live at:
   - `https://medvault-<your-username>.vercel.app`

---

## Step 5: Verify Live Demo for Your Resume

Open your live frontend URL and verify each station using the built-in **Quick Presets** on the login screen:

1. **Doctor Station**:
   - Click the **Doctor** preset button (`doctor@medvault.test`) > **Sign In**.
   - View clinical queue, patient timeline, and enter diagnoses.
2. **Pharmacy Station**:
   - Click the **Pharmacy** preset button (`pharmacy@medvault.test`) > **Sign In**.
   - Check stock levels (Amoxicillin, Paracetamol, etc.), restock inventory, and dispense prescriptions.
3. **Registration & Beneficiary ID**:
   - Click the **Registration** preset button (`worker@medvault.test`) > **Sign In**.
   - Register a new patient and see the deterministic Beneficiary ID (`MV26XXXX`), QR Code card, and printable PDF.
4. **Admin Console**:
   - Click the **Admin** preset button (`admin@local.test`) > **Sign In**.
   - Monitor system telemetry, active staff accounts, and operational status.

---

## Resume Presentation Snippet

You can include MedVault on your resume with this format:

> **MedVault — Concurrency-Safe Clinical Identity & Pharmacy Platform**  
> *Live Demo:* `https://med-vault-aia7.vercel.app` | *GitHub:* `https://github.com/Kabirwsnk/MedVault`  
> - Engineered an enterprise clinical healthcare system with role-based access control (Admin, Doctor, Pharmacy, Registration, Patient).  
> - Designed deterministic Beneficiary ID generation using PostgreSQL advisory locks and atomic two-phase prescription dispensing.  
> - Built resilient offline-first encounter drafts in IndexedDB with idempotent retry synchronization and cryptographic QR health cards.
