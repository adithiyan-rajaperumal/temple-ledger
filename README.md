# 🛕 Temple & Community Ledger System (கோவில் கணக்கு மேலாண்மை)

> **A production-ready, open-source, double-entry accounting and transparency platform tailored for village temples, community renovation projects, and charitable trusts.**

[![Build & Backend Tests](https://img.shields.io/badge/Backend%20Tests-54%20Passing-brightgreen.svg)]()
[![Frontend Tests](https://img.shields.io/badge/Frontend%20Tests-Passed-brightgreen.svg)]()
[![Java](https://img.shields.io/badge/Java-17%20%7C%2021-orange.svg)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)]()
[![React](https://img.shields.io/badge/React-18.3-blue.svg)]()
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

---

## 📑 Table of Contents

- [Executive Overview](#-executive-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [System Architecture Diagram](#-system-architecture-diagram)
- [Local Development Quickstart](#-local-development-quickstart)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (Spring Boot)](#backend-setup-spring-boot)
  - [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
  - [Default Demo Credentials](#default-demo-credentials)
  - [Running Automated Verification Suites](#running-automated-verification-suites)
- [Supabase PostgreSQL Configuration Guide](#-supabase-postgresql-configuration-guide)
- [Render Backend Deployment Guide](#-render-backend-deployment-guide)
- [Cloudflare Pages Frontend Deployment Guide](#-cloudflare-pages-frontend-deployment-guide)
- [Outsourcing & White-Labeling Guide (15-Minute Deployment)](#-outsourcing--white-labeling-guide-15-minute-deployment)
- [Security & Audit Integrity](#-security--audit-integrity)
- [License](#-license)

---

## 🌟 Executive Overview

Community projects and village temple renovations face a common set of financial challenges:
1. **Financial Opacity**: Lack of real-time visibility leads to community skepticism and slow donation collection.
2. **Multi-Part Pledges**: Village families commit to multiple sequential drives (e.g., Drive 1 @ ₹10,000, Drive 2 @ ₹20,000) paid across sporadic cash installments and digital UPI payments.
3. **In-Kind Material Donations**: Devotees donate physical building materials (cement, river sand, teak doors, structural steel) alongside cash, requiring strict non-liquid asset tracking to avoid inflating liquid cash reserves.
4. **Contractor Milestones**: Civil contractors require staged milestone payouts with retention money withheld until quality verification.
5. **Volunteer Travel & Field Expenses**: Transparent accounting is required for volunteers collecting funds in nearby towns and villages.

The **Temple & Community Ledger System** solves these challenges with a hardened double-entry core, an unauthenticated public transparency dashboard, a bilingual (English / தமிழ்) interface, WhatsApp digital receipts, and a complete immutable audit trail.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Zero Financial Leakage** | Strict **Double-Entry General Ledger** (`ASSET`, `LIABILITY`, `EQUITY`, `INCOME`, `EXPENSE`). Every transaction creates balanced journal postings ($\sum \text{Debits} = \sum \text{Credits}$). |
| **Bilingual Localization (EN / தமிழ்)** | Instant toggle between **English** and **தமிழ் (Tamil)** across every screen, receipt, modal, and data grid with 100% translation key parity and full Unicode UTF-8 support. |
| **Public Transparency Dashboard** | Real-time community portal accessible without login. Features real-time balance metrics, income/expense pie charts, multi-drive progress bars, and a filterable transaction grid. |
| **Multi-Drive Village Family System** | Supports $1 \dots N$ village contribution drives with custom target quotas per family, opt-out/exemption tracking with audited reasons, and multi-part installment histories. |
| **Universal Devotee Pledges & In-Kind Segregation** | Tracks monetary and physical material pledges. Built-in real-time valuation ($Qty \times Rate$) and distinct non-cash material equity segregation to protect cash books. |
| **WhatsApp Receipts & Digital Print Vouchers** | Generates official receipts (`RCT-YYYY-XXXXX`) and expense vouchers (`VCH-YYYY-XXXXX`) with 1-click WhatsApp sharing formatted in English and Tamil with Indian currency formatting. |
| **Contractor Milestone & Retention Management** | Tracks agreed contract sums, milestone disbursements, and automatically guards against payouts exceeding remaining retention balances. |
| **Volunteer Collection Expenses** | Accounts for volunteer fuel, travel, and meal stipends during collection drives with mandatory vehicle mode and volunteer logging. |
| **Role-Based Security & Immutable Audit Trail** | Spring Security JWT with role hierarchy (`ROLE_SUPER_ADMIN` and `ROLE_DATA_ENTRY`). Append-only audit log records actor, IP, timestamp, action, and before/after JSON diffs. |

---

## 🛠 Architecture & Tech Stack

### Backend
- **Framework**: Spring Boot 3.3.4 (Java 17 / 21)
- **Persistence**: Spring Data JPA & Hibernate 6
- **Database**: PostgreSQL 15+ (Production on Supabase) / H2 in-memory (Unit & Integration Testing)
- **Migrations**: Flyway (`V1__init_schema.sql`, `V2__seed_chart_of_accounts.sql`)
- **Security**: Spring Security 6 with Stateless JWT (JJWT 0.12.6) and BCrypt password encryption
- **Containerization**: Multi-stage Docker image using Eclipse Temurin 17 JRE Alpine

### Frontend
- **Framework**: React 18.3 with Vite 5.4
- **Styling**: Tailwind CSS 3.4 with custom temple gold & terracotta palette
- **Icons**: Lucide React
- **Visualizations**: Recharts 2.12 (Income vs. Expense breakdown, Drive progress)
- **Localization**: react-i18next & i18next (Tamil & English language packs)
- **Routing**: React Router DOM 6 with protected routes and role-based access control
- **HTTP Client**: Axios with automatic JWT injection and 401 session recovery

### Cloud Infrastructure
- **Frontend Hosting**: Cloudflare Pages (Edge CDN, global low-latency, SPA `_redirects` routing)
- **Backend Hosting**: Render (Docker containerized web service with JVM container memory flags)
- **Database**: Supabase (Managed PostgreSQL 15+ with pgCrypto and automated backups)

---

## 🏛 System Architecture Diagram

```
+----------------------------------------------------------------------------------+
|                              CLIENTS / BROWSER                                   |
|   +--------------------------------------------------------------------------+   |
|   |  React 18 SPA (Vite + Tailwind CSS + Lucide Icons + Recharts)            |   |
|   |  - Bilingual i18n Engine: English <-> Tamil (தமிழ்)                      |   |
|   |  - Public Portal: Transparency Dashboard, Drive Board & Data Grid        |   |
|   |  - Admin Portal: Role-guarded Data Entry, Family Management, Audit Trail |   |
|   +--------------------------------------------------------------------------+   |
+---------------------------------------+------------------------------------------+
                                        | HTTPS (REST API + JWT Bearer)
                                        v
+----------------------------------------------------------------------------------+
|                    BACKEND: SPRING BOOT 3 (Eclipse Temurin JRE 17)               |
|                       Hosted on Render (Docker container)                        |
|                                                                                  |
|   [Security Filter Chain]  <-- Stateless JWT (Super Admin / Data Entry Operator) |
|   [Public Path Matcher]    <-- /api/v1/public/** (Permit All)                    |
|                                                                                  |
|   [Domain Modules]                                                               |
|   ├── accounting-core     : Chart of Accounts, Double-Entry Journals, Postings   |
|   ├── inflow-service      : Cash & GPay Donations, In-Kind Materials, Receipts   |
|   ├── outflow-service     : Materials, Labour Wages, Volunteer Travel & Meals    |
|   ├── drive-service       : Family Master, Drives (1..N), Installment Ledger     |
|   ├── contract-service    : Contractor Work Orders & Milestone Disbursements     |
|   ├── audit-service       : Entity Revision Listeners & Immutable Log History    |
|   └── report-service      : Dashboard Aggregations, Filterable Grid, CSV Export  |
+---------------------------------------+------------------------------------------+
                                        | JDBC / HikariCP Pool (SSL Mode Required)
                                        v
+----------------------------------------------------------------------------------+
|                    DATABASE: SUPABASE POSTGRESQL (v15+)                          |
|   - Double-entry ledger tables (accounts, journal_entries, journal_postings)     |
|   - Inflow / Outflow tables (donations, expenses, in_kind_assets)                |
|   - Family & Drive tables (families, drives, drive_allocations, pledges)         |
|   - Contractor & Work Order tables (contractors, work_orders)                    |
|   - System Audit Log table (audit_logs - append-only)                            |
+----------------------------------------------------------------------------------+
```

---

## 💻 Local Development Quickstart

### Prerequisites
- **Java**: JDK 17 or higher (`java -version`)
- **Maven**: 3.9+ (`mvn -version`)
- **Node.js**: Node 18+ and npm 9+ (`node -v`, `npm -v`)
- **Git**: Installed and configured

### Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Optional) Configure environment variables in `.env` or pass directly. For local development, the backend defaults to PostgreSQL on `localhost:5432/temple_ledger` or you can activate the H2 test profile.
   ```bash
   # Set environment variables if using a local PostgreSQL database
   export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/temple_ledger
   export SPRING_DATASOURCE_USERNAME=postgres
   export SPRING_DATASOURCE_PASSWORD=postgres
   export JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   ```

3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   The backend will start on `http://localhost:8080`. Flyway will automatically execute database migrations (`V1__init_schema.sql` and `V2__seed_chart_of_accounts.sql`).

### Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will launch on `http://localhost:3000` (or `http://localhost:5173`).
   *Requests to `/api` are automatically proxied to `http://localhost:8080` via Vite's development proxy.*

### Default Demo Credentials

The initial database seed provisions default administrative accounts for testing and verification:

| Role | Username | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin` | `admin123` | Full access: Data entry, Family/Drive config, Contractor management, User provisioning, Immutable Audit Trail |
| **Data Entry** | `operator1` | `operator123` | Data entry access: Record donations, record expenses, record devotee pledges, contractor milestones |

*Demo quick-fill buttons are provided on the `/login` page for fast testing.*

### Running Automated Verification Suites

Verify all backend and frontend components with the automated test suites:

```bash
# 1. Run all 54 Spring Boot Backend Integration & Unit Tests
mvn -f backend/pom.xml test

# 2. Run all Frontend Unit & Parity Tests (i18n, formatters, grid, receipts, auth)
npm test --prefix frontend

# 3. Verify Production Production Frontend Build & SPA Routing
npm run build --prefix frontend
```

---

## 🗄 Supabase PostgreSQL Configuration Guide

Supabase provides a reliable, cloud-hosted PostgreSQL database with built-in daily backups.

1. **Sign Up / Log In**: Visit [supabase.com](https://supabase.com) and create an organization/account.
2. **Create New Project**:
   - Project Name: `temple-ledger-db`
   - Database Password: Create a strong password (save this securely).
   - Region: Select the region nearest your community (e.g., `South Asia (Mumbai)`).
3. **Retrieve Database Connection Details**:
   - In Supabase Dashboard, navigate to **Project Settings** > **Database**.
   - Under **Connection string**, select **JDBC**.
   - Format:
     ```
     jdbc:postgresql://db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require
     ```
4. **Flyway Automated Migration**:
   - When the Spring Boot application connects to Supabase on initial startup, Flyway will detect the empty schema and automatically apply:
     - `V1__init_schema.sql` (Creates custom ENUMs, double-entry ledger, pledges, drives, and audit tables).
     - `V2__seed_chart_of_accounts.sql` (Seeds standard temple chart of accounts and initial admin users).

---

## ☁️ Render Backend Deployment Guide

Deploying the Spring Boot backend container to [Render](https://render.com) takes less than 5 minutes using the included `render.yaml` Blueprint or manual setup.

### Option 1: Render Blueprint (Recommended)
1. Fork or push this repository to your GitHub account.
2. In the Render Dashboard, click **New +** > **Blueprint**.
3. Select your repository. Render will automatically detect `render.yaml`.
4. Render will prompt you for the `sync: false` environment variables:
   - `SPRING_DATASOURCE_URL`: Your Supabase JDBC URL (`jdbc:postgresql://db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require`)
   - `SPRING_DATASOURCE_USERNAME`: `postgres`
   - `SPRING_DATASOURCE_PASSWORD`: Your Supabase database password
5. Render will automatically generate a cryptographically secure `JWT_SECRET`.
6. Click **Apply**. Render will build the multi-stage Docker image and launch the web service.

### Option 2: Manual Web Service Setup
1. In Render Dashboard, click **New +** > **Web Service**.
2. Select **Build and deploy from a Git repository**.
3. Set the following configuration:
   - **Name**: `temple-ledger-backend`
   - **Language / Runtime**: `Docker`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: `backend`
   - **Instance Type**: `Free` (or `Starter`)
   - **Health Check Path**: `/api/v1/public/dashboard/summary`
4. Add the following **Environment Variables**:
   ```ini
   PORT=8080
   SPRING_DATASOURCE_URL=jdbc:postgresql://db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=<your-supabase-db-password>
   JWT_SECRET=<generate-random-64-character-hex-string>
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://*.pages.dev
   ```
5. Click **Create Web Service**.

---

## ⚡ Cloudflare Pages Frontend Deployment Guide

Deploy the React 18 single-page application to [Cloudflare Pages](https://pages.cloudflare.com) for edge hosting.

1. **Log in to Cloudflare Dashboard**: Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. **Select Repository**: Choose your `temple-ledger` repository.
3. **Configure Build Settings**:
   - **Project Name**: `temple-ledger` (or your temple name, e.g. `arunachala-temple`)
   - **Production Branch**: `main` (or your deployment branch)
   - **Framework Preset**: `None` (or `Vite`)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. **Environment Variables**:
   Under **Settings** > **Environment variables**, add:
   ```ini
   VITE_API_URL=https://<your-render-backend-name>.onrender.com/api/v1
   ```
5. **SPA Routing Support**:
   - Cloudflare Pages automatically recognizes the `_redirects` file (`/* /index.html 200`) present in `frontend/public/_redirects` which Vite copies into `dist/_redirects`.
   - This ensures all direct browser navigation paths (e.g. `/grid`, `/drives`, `/admin/donations`, `/login`) resolve correctly to `index.html` without 404 errors.
6. **Deploy**: Click **Save and Deploy**. Your site will be live across Cloudflare's global edge network in seconds at `https://<your-project>.pages.dev`.

---

## 📋 Outsourcing & White-Labeling Guide (15-Minute Deployment)

Follow this step-by-step checklist to deploy a completely customized, white-labeled instance for any new temple, village committee, or non-profit trust in **under 15 minutes**.

### Step 1: Branding & Identification (3 Minutes)
1. Open `frontend/src/i18n/locales/en.json` and `frontend/src/i18n/locales/ta.json`:
   - Replace `"title": "Temple & Community Ledger"` with the new entity name (e.g. `"Sri Muthumariamman Temple Trust"` / `"ஸ்ரீ முத்துமாரியம்மன் கோவில் திருப்பணி"`).
   - Update village name, taluk, district, and contact details.
2. In `frontend/index.html`, update `<title>` and favicon.
3. In `frontend/src/components/Navbar.jsx`, update the logo badge or deity icon if desired.

### Step 2: Database & Initial Accounts Customization (4 Minutes)
1. Create a free Supabase project for the client/trust.
2. (Optional) Customize `backend/src/main/resources/db/migration/V2__seed_chart_of_accounts.sql`:
   - Adjust bank account ledger names (e.g., replace `"SBI Current Account"` with the trust's actual bank account name).
   - Set up initial donation drive records (e.g., `"Maha Kumbabishekam Phase 1"`).
3. If importing an existing family roster, populate the `families` table via SQL or use the Admin Portal's **"Add Family"** feature after deployment.

### Step 3: Launch Cloud Backend (5 Minutes)
1. Fork this repository or create a new private repository for the client.
2. In Render, deploy the Blueprint (`render.yaml`) pointing to the client's Supabase database credentials.
3. Note the public backend URL: `https://<client-backend>.onrender.com`.

### Step 4: Launch Frontend on Cloudflare Pages (2 Minutes)
1. In Cloudflare Pages, connect the repository.
2. Set Root Directory to `frontend`.
3. Set `VITE_API_URL` to `https://<client-backend>.onrender.com/api/v1`.
4. Deploy! Your client's instance is live.

### Step 5: Onboarding & Security Handover (1 Minute)
1. Log in to the new portal using the default Super Admin credentials (`admin` / `admin123`).
2. Navigate to **Operators** (`/admin/users`):
   - Create accounts for local trust trustees and data entry operators.
   - Immediately change the default `admin` password to a secure permanent password.
3. Provide the public dashboard link (e.g., `https://temple-ledger.pages.dev`) to the community WhatsApp group for public transparency.

---

## 🔒 Security & Audit Integrity

1. **Stateless JWT Architecture**: User sessions are backed by digitally signed, tamper-proof JSON Web Tokens with configurable expiration (default 24 hours).
2. **Role Separation**:
   - `ROLE_SUPER_ADMIN`: Authorizes family registration, drive configuration, contractor approvals, operator provisioning, and audit log analysis.
   - `ROLE_DATA_ENTRY`: Strictly restricted to transaction recording and receipt issuance.
3. **Immutable Audit Trail**:
   - Every creation, modification, opt-out, or status update creates a timestamped record in `audit_logs`.
   - Records actor username, client IP address, action type (`CREATE`, `UPDATE`, `STATUS_CHANGE`), entity class, and full JSON diff of the modified state.
   - Audit logs are append-only; the database prevents deletion or alteration.
4. **Non-Root Docker Hardening**: The production backend container runs under an unprivileged `appuser:appgroup` within an Alpine Linux sandbox.
5. **Double-Entry Reconciliation**: Transactions are prevented from committing if total debit and credit amounts do not match to the exact paisa (0.00).

---

## 📄 License

This project is licensed under the **MIT License**. You are free to clone, modify, distribute, white-label, and deploy this software for any temple, charitable trust, or community organization without restriction.
