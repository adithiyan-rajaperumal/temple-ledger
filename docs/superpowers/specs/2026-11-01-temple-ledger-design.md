# Design Specification: Generic Community & Temple Ledger System

- **Date**: 2026-11-01
- **Status**: Approved by User
- **Target Platforms**: 
  - Frontend: React 18+ (Vite, Tailwind CSS, Recharts, react-i18next) deployed to Cloudflare Pages
  - Backend: Spring Boot 3 (Java 21, Spring Data JPA, Spring Security JWT) deployed to Render
  - Database: PostgreSQL on Supabase (managed via Flyway migrations)
- **Primary Languages**: English & Tamil (தமிழ்) with instant toggle

---

## 1. Executive Summary & Purpose

The **Temple Ledger System** is a modular, transparent, and auditable accounting platform tailored for village temples, community projects, and charitable trusts. While initialized for a village temple renovation with targeted community contributions and renovation work, the platform is architected as an easily outsourceable and deployable open-source template that can be cloned and configured for any community initiative.

### Key Objectives
1. **Zero Financial Leakage**: Every rupee collected (cash book, GPay) and spent (material purchases, wages, contractor milestones, volunteer travel/food) is accounted for with double-entry journal integrity.
2. **Community Transparency**: A public read-only portal where any community member or donor can view real-time balances, income vs. expense pie charts, family contribution statuses, and a master filterable transaction grid without needing login credentials.
3. **Multi-Drive Family Commitments**: Support for 1-to-many village contribution drives (e.g., Drive 1 @ ₹10,000/family, Drive 2 @ ₹20,000/family) with customizable participation per drive (opt-ins, opt-outs, custom pledge targets) and multi-part installment tracking.
4. **Bilingual Accessibility**: Full English and Tamil (தமிழ்) localization across the UI, data grid, receipt generation, and reports.
5. **Role-Based Security & Immutable Audit Trail**: Strict separation between Super Admin and Data Entry Operators, with complete before-and-after audit logs for every creation, modification, or reversal.

---

## 2. Architecture & Deployment Model

```
+----------------------------------------------------------------------------------+
|                              CLIENTS / BROWSER                                   |
|   +--------------------------------------------------------------------------+   |
|   |  React 18 SPA (Vite + Tailwind CSS + Lucide Icons + Recharts)            |   |
|   |  - i18n Engine (react-i18next): English <-> Tamil (தமிழ்)                |   |
|   |  - Public Portal: Transparency Dashboard, Drive Board & Data Grid        |   |
|   |  - Admin Portal: Role-guarded Data Entry, Family Management, Audit Trail |   |
|   +--------------------------------------------------------------------------+   |
+---------------------------------------+------------------------------------------+
                                        | HTTPS (REST API + JWT)
                                        v
+----------------------------------------------------------------------------------+
|                        BACKEND: SPRING BOOT 3 (Java 21)                          |
|                       Hosted on Render (Docker container)                        |
|                                                                                  |
|   [Security Filter Chain]  <-- Stateless JWT (Super Admin / Data Entry Operator) |
|   [Public Path Matcher]    <-- /api/v1/public/** (Permit All)                    |
|                                                                                  |
|   [Domain Modules]                                                               |
|   ├── accounting-core     : Chart of Accounts, Double-Entry Journals, Balances   |
|   ├── inflow-service      : Cash & GPay Donations, In-Kind Materials, Receipts   |
|   ├── outflow-service     : Materials, Labour Wages, Volunteer Travel & Meals    |
|   ├── drive-service       : Family Master, Drives (1..N), Installment Ledger     |
|   ├── contract-service    : Contractor Work Orders & Milestone Disbursements     |
|   ├── audit-service       : Entity Revision Listeners & Immutable Log History    |
|   └── report-service      : Dashboard Aggregations, Filterable Grid, PDF Export  |
+---------------------------------------+------------------------------------------+
                                        | JDBC / HikariCP Pool
                                        v
+----------------------------------------------------------------------------------+
|                    DATABASE: SUPABASE POSTGRESQL (v15+)                          |
|   - Double-entry ledger tables (Accounts, Journal Entries, Postings)             |
|   - Transaction tables (Inflows, Outflows, In-Kind Assets)                       |
|   - Family & Drive tables (Master Families, Drive Allocations, Installments)     |
|   - Contractor & Work Order tables                                               |
|   - System Audit Log table (append-only)                                         |
+----------------------------------------------------------------------------------+
```

### Deployment Topology
* **Frontend**: Built via `vite build` into static distribution files and deployed to **Cloudflare Pages**. Edge routing handles SPA fallback (`/* -> /index.html`).
* **Backend**: Packaged as a lightweight containerized Spring Boot JAR running on **Render**. Environment variables configure Supabase database credentials, JWT secret, and CORS origins.
* **Database**: Hosted on **Supabase** (PostgreSQL 15+). Schema migrations are automated on startup via **Flyway**.

---

## 3. Bilingual Support (i18n: English / Tamil)

* **Architecture**: Configured using `react-i18next` with modular JSON language packs (`en.json` and `ta.json`).
* **UI Coverage**:
  * Navigation items, headers, metric cards, status pills, table headers, and form input labels.
  * Common temple accounting terms:
    * Income: வருமானம் (*Varumanam*)
    * Expense: செலவு (*Selavu*)
    * Balance: இருப்பு (*Iruppu*)
    * Contribution Drive / Call: வரி / தீர்மானம் (*Vari / Theermanam*)
    * Family: குடும்பம் (*Kudumbam*)
    * In-Kind / Material: பொருள் நன்கொடை (*Porul Nangodai*)
    * Receipt: ரசீது (*Raseedhu*)
    * Voucher: செலவுச்சீட்டு (*Selavucheettu*)
* **Receipt Localization**: Digital receipts can be rendered in Tamil, English, or a combined bilingual layout.
* **UTF-8 Support**: Full end-to-end Unicode support in PostgreSQL, Spring Boot, and React for Tamil script in donor names, street names, and remarks.

---

## 4. Data Model & Database Schema

### 4.1 Chart of Accounts & General Ledger (Double-Entry Core)
```sql
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,      -- e.g. 1010, 1020, 4010, 5010
    name VARCHAR(128) NOT NULL,             -- English name
    name_ta VARCHAR(128),                   -- Tamil name
    type account_type NOT NULL,
    parent_id UUID REFERENCES accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(64) UNIQUE NOT NULL, -- e.g. JE-2026-0001
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(64) NOT NULL,     -- 'DONATION', 'EXPENSE', 'IN_KIND', 'CONTRACT_PAYOUT'
    reference_id UUID,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    debit_amount NUMERIC(14, 2) DEFAULT 0.00 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(14, 2) DEFAULT 0.00 CHECK (credit_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0)
    )
);
```

### 4.2 Commitments, Pledges & Multi-Drive Tracking

The system supports a **Universal Pledge Engine** that handles both structured village drives (e.g., 60 families × ₹10k or ₹20k) and custom donor pledges (external devotees or sponsors committing money or materials in installments):

```sql
CREATE TYPE pledge_type AS ENUM ('MONETARY', 'IN_KIND_MATERIAL', 'HYBRID');
CREATE TYPE pledge_status AS ENUM ('PENDING', 'PARTIALLY_FULFILLED', 'COMPLETED', 'CANCELLED');

CREATE TABLE pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pledge_code VARCHAR(32) UNIQUE NOT NULL,    -- e.g. PLG-2026-0001
    pledge_date DATE NOT NULL,
    pledge_type pledge_type NOT NULL DEFAULT 'MONETARY',
    donor_name VARCHAR(128) NOT NULL,
    donor_name_ta VARCHAR(128),
    village VARCHAR(128),
    phone VARCHAR(20),
    family_id UUID REFERENCES families(id),      -- Linked if village family member
    drive_id UUID REFERENCES drives(id),        -- Linked if part of specific Drive
    target_monetary_amount NUMERIC(12, 2) DEFAULT 0.00,
    target_material_desc TEXT,                  -- e.g. "100 bags of Ultratech Cement"
    target_material_qty NUMERIC(10, 2) DEFAULT 0.00,
    target_material_unit VARCHAR(32),           -- "BAGS", "LOADS", "DOORS"
    status pledge_status DEFAULT 'PENDING',
    notes TEXT,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. FAM-001 to FAM-060
    head_name VARCHAR(128) NOT NULL,
    head_name_ta VARCHAR(128),
    door_no VARCHAR(32),
    street VARCHAR(128),
    village VARCHAR(128) NOT NULL DEFAULT 'Main Village',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE drive_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

CREATE TABLE drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,        -- e.g. DRIVE-1, DRIVE-2
    name VARCHAR(128) NOT NULL,              -- "Initial Renovation Fund"
    name_ta VARCHAR(128),                    -- "முதல் கட்ட திருப்பணி நிதி"
    default_target_per_family NUMERIC(12,2) NOT NULL, -- e.g. 10000.00 or 20000.00
    start_date DATE NOT NULL,
    end_date DATE,
    status drive_status DEFAULT 'ACTIVE',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE commitment_status AS ENUM ('PARTICIPATING', 'OPTED_OUT', 'EXEMPTED');

CREATE TABLE drive_family_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    target_amount NUMERIC(12, 2) NOT NULL,    -- Can override default (e.g. 10000, 15000, 0)
    status commitment_status DEFAULT 'PARTICIPATING',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_drive_family UNIQUE (drive_id, family_id)
);
```

### 4.3 Inflows: Donations, Installments & In-Kind Materials
```sql
CREATE TYPE payment_mode AS ENUM ('CASH', 'GPAY_ONLINE', 'IN_KIND');
CREATE TYPE donation_source AS ENUM ('VILLAGE_FAMILY_DRIVE', 'GENERAL_PUBLIC');

CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no VARCHAR(64) UNIQUE NOT NULL,      -- Generated system receipt number e.g. RCT-2026-0001
    donation_date DATE NOT NULL,
    donor_source donation_source NOT NULL,
    family_id UUID REFERENCES families(id),
    drive_id UUID REFERENCES drives(id),
    pledge_id UUID REFERENCES pledges(id),       -- Linked if paying an installment on a pledge
    donor_name VARCHAR(128) NOT NULL,
    donor_name_ta VARCHAR(128),
    village VARCHAR(128),
    phone VARCHAR(20),
    payment_mode payment_mode NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    physical_book_receipt_no VARCHAR(64),       -- Manual receipt book reference #
    gpay_transaction_id VARCHAR(64),            -- UTR / Transaction ID
    notes TEXT,
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE in_kind_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID UNIQUE REFERENCES donations(id) ON DELETE CASCADE,
    item_category VARCHAR(64) NOT NULL,         -- 'CEMENT', 'RIVER_SAND', 'DOORS', 'ELECTRICAL', 'STEEL'
    item_description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,                  -- 'BAGS', 'LOADS', 'PIECES', 'METERS'
    approximate_unit_rate NUMERIC(10, 2) NOT NULL,
    total_estimated_value NUMERIC(12, 2) NOT NULL,
    storage_location VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Outflows: Renovation Expenses, Labour Wages, Contracts & Travel
```sql
CREATE TYPE expense_category AS ENUM (
    'MATERIAL_PURCHASE',       -- River sand, cement, bricks, wiring
    'LABOUR_WAGES',            -- Daily/weekly wage disbursements
    'CONTRACT_PAYOUT',         -- Milestone release to contractors
    'COLLECTION_FIELD_EXPENSE',-- Petrol, bus fare, volunteer food
    'TEMPLE_RITUAL_MISC'       -- Pooja supplies, sound, lighting, miscellaneous
);

CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_name VARCHAR(128) NOT NULL,
    trade VARCHAR(64) NOT NULL,                 -- 'PAINTING', 'MASONRY', 'CARPENTRY', 'ELECTRICAL'
    phone VARCHAR(20),
    total_agreed_amount NUMERIC(14, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_no VARCHAR(64) UNIQUE NOT NULL,      -- e.g. VCH-2026-0001
    expense_date DATE NOT NULL,
    category expense_category NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode payment_mode NOT NULL DEFAULT 'CASH',
    paid_to VARCHAR(128) NOT NULL,              -- Vendor name, worker head, or volunteer
    contractor_id UUID REFERENCES contractors(id),
    contract_milestone_desc VARCHAR(128),
    volunteer_name VARCHAR(128),                -- Volunteer who took travel/food allowance
    travel_mode_vehicle VARCHAR(64),            -- 'CAR', 'BUS', 'TWO_WHEELER'
    invoice_bill_no VARCHAR(64),
    description TEXT NOT NULL,
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 Security & Audit Trail
```sql
CREATE TYPE user_role AS ENUM ('ROLE_SUPER_ADMIN', 'ROLE_DATA_ENTRY');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(64) NOT NULL,           -- 'DONATION', 'EXPENSE', 'DRIVE_ALLOCATION', 'USER'
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(16) NOT NULL,                -- 'CREATE', 'UPDATE', 'VOID'
    performed_by VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45),
    before_state JSONB,
    after_state JSONB,
    change_reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Domain Rules & Business Logic

### 5.1 Inflow & Universal Installment Processing Logic
1. **Receipt Book or GPay Tracking**:
   * For Cash donations: `physical_book_receipt_no` is mandatory.
   * For GPay/Online donations: `gpay_transaction_id` is mandatory.
   * System auto-assigns an unalterable global digital receipt number: `RCT-YYYY-XXXXX`.
2. **Universal Installments for Pledges & Drives**:
   * Any donation can link to an active **Pledge** or a **Village Family Drive**:
     * A donor committing ₹50,000 can pay across multiple installments via cash, GPay, or materials.
     * A sponsor committing 100 bags of cement or 4 doors can deliver them in installment batches.
     * Each installment logs its respective mode (`CASH` with book receipt, `GPAY_ONLINE` with transaction ID, or `IN_KIND` with quantity & valuation).
     * The system atomically updates the parent Pledge's `fulfilled_amount` / `fulfilled_material_qty` and calculates remaining balance due.
     * When fully fulfilled, the pledge status updates to `COMPLETED`.
   * **One-Off Donations**: Direct donations without a pledge are processed immediately as 100% fulfilled single-entry receipts.
3. **In-Kind Material Donations**:
   * Stored with physical quantity, unit, and market estimated rate.
   * Journal entry debits `1030 (In-Kind Material Stock)` and credits `4030 (In-Kind Material Contributions)`.
   * **Dashboard Segregation**: In-kind valuation is accounted for under total community contribution, but strictly isolated from `Spendable Cash/Bank Balance`.

### 5.2 Outflow Processing Logic
1. **Volunteer Travel & Meal Disbursements**:
   * Category: `COLLECTION_FIELD_EXPENSE`.
   * Requires `volunteer_name`, `amount`, and `description` (e.g., *Petrol for donation drive to Tirupur, 4 volunteers*).
   * Posted as an immediate expense voucher against `1010 (Cash in Hand)`.
2. **Contractor Milestone Disbursements**:
   * Category: `CONTRACT_PAYOUT`.
   * Requires `contractor_id`.
   * Validates that cumulative disbursements do not exceed `total_agreed_amount` unless authorized by Super Admin.
   * Updates contractor's `paid_to_date` and remaining retention balance.

### 5.3 Multi-Drive Family Configuration
1. **Drive Initialization**:
   * Super Admin creates a new drive (e.g. Drive 2 @ ₹20,000).
   * One-click option: "Initialize from Master Family List" populates `drive_family_allocations` for all active families.
2. **Dynamic In-Between Changes**:
   * A family can be marked `OPTED_OUT` or `EXEMPTED` for a specific drive with an audit note. Target becomes ₹0.
   * A new family joining later can be added to existing or new drives immediately.
   * Custom target override allowed (e.g., a family voluntarily pledging ₹25,000 for Drive 2).

---

## 6. Transparency Dashboard & Master Data Grid

### 6.1 Public Transparency Dashboard (No Login Needed)
* **KPI Metrics**:
  * **Spendable Cash & Bank Balance**: Net actual liquid funds remaining.
  * **Total Monetary Collections**: Total cash + online received.
  * **Total Monetary Expenses**: Total money paid out.
  * **In-Kind Materials Value**: Total estimated worth of donated goods on site.
  * **Active Commitments Balance**: Total pending village family drive pledges + remaining contractor liabilities.
* **Charts**:
  * Inflows Breakdown (Pie Chart): Drive 1 vs Drive 2 vs Devotee Cash vs GPay vs In-Kind.
  * Outflows Breakdown (Pie Chart): Materials vs Labour Wages vs Contractor Payouts vs Travel/Food.
  * Inflow vs Outflow Comparison (Bar / Area Chart): Timeline tracking fund growth and expenditures.

### 6.2 Public Family Drive Status Board (கிராம பங்களிப்பு நிலவரம்)
* **Drive Filter Dropdown**: Choose between Drive 1 (₹10k), Drive 2 (₹20k), or Consolidated All Drives.
* **Summary Banner**: Total Drive Target | Total Collected | Total Pending | Completion %.
* **Filterable Table**:
  * Columns: Family Code, Head Name (Tamil/English), Village/Street, Target (₹), Paid (₹), Due (₹), Status (`PAID`, `PARTIAL`, `PENDING`, `OPTED_OUT`), and "View History" modal.
  * Search bar: Type family name, code, or street to instantly view their standing.

### 6.3 Master Filterable Transaction Data Grid
* Displays all financial movements in a unified table.
* **Filter Controls**:
  * **Flow Type**: All / Inflow Only / Outflow Only / In-Kind Only
  * **Category**: Multi-select dropdown for expense and donation categories
  * **Payment Method**: Cash / GPay Online / In-Kind
  * **Date Range**: Today, This Week, This Month, or Custom From/To
  * **Text Search**: Real-time filtering across Donor Name, Village, Volunteer, Receipt No, GPay Txn ID, or Voucher No.
* **Export Utilities**: Export currently filtered dataset to **CSV**, **Excel (.xlsx)**, or print-ready **PDF**.

---

## 7. Digital Receipts & WhatsApp Sharing

* **Bilingual Design**: Clean temple header, temple seal graphic, bilingual labels (*Receipt No / ரசீது எண்*, *Date / தேதி*, *Donor / நன்கொடையாளர்*).
* **Security QR Code**: Each receipt prints a scannable verification QR code linking directly to the public receipt verification endpoint.
* **WhatsApp Share Integration**:
  * One-click button on receipt modal:
  * Generates formatted message:
    > "வணக்கம் [Donor Name], எங்கள் கோவில் திருப்பணிக்கு உங்கள் அன்பான நன்கொடை ₹[Amount] வெற்றிகரமாக பெறப்பட்டது. ரசீது எண்: [Receipt No]. ரசீதை பதிவிறக்கம் செய்ய: [Public URL]"
    > "Greetings [Donor Name], thank you for your generous contribution of ₹[Amount] towards our temple renovation. Receipt No: [Receipt No]. Download Receipt: [Public URL]"

---

## 8. REST API Specifications

### 8.1 Public APIs (Unauthenticated)
* `GET /api/v1/public/dashboard/summary` - Aggregated balances, inflows, outflows, in-kind valuation.
* `GET /api/v1/public/dashboard/charts` - Categorized data for pie and trend charts.
* `GET /api/v1/public/drives` - List of active and completed drives with targets.
* `GET /api/v1/public/drives/{driveId}/families` - Public family status table for a drive.
* `GET /api/v1/public/transactions` - Filterable, paginated data grid (supports `search`, `category`, `type`, `mode`, `startDate`, `endDate`, `page`, `size`).
* `GET /api/v1/public/receipts/{receiptNo}` - View digital receipt by receipt number.

### 8.2 Authenticated APIs (Data Entry & Super Admin)
* `POST /api/v1/auth/login` - Authenticate username/password, returns JWT.
* `POST /api/v1/donations` - Record monetary or in-kind donation.
* `POST /api/v1/expenses` - Record expense voucher (materials, wages, travel, contract).
* `GET /api/v1/contractors` & `POST /api/v1/contractors` - Manage contractor profiles.

### 8.3 Super Admin Only APIs
* `POST /api/v1/admin/users` - Create data entry user accounts.
* `GET /api/v1/admin/users` - List all system users.
* `POST /api/v1/admin/drives` - Create new drive and initialize family allocations.
* `PATCH /api/v1/admin/drives/{driveId}/allocations/{familyId}` - Customize target or opt-out family.
* `POST /api/v1/admin/families` - Manage master family directory.
* `GET /api/v1/admin/audit-logs` - Query immutable audit trail logs.
* `POST /api/v1/admin/transactions/{id}/void` - Void/reverse transaction with required justification note.

---

## 9. Error Handling & Validation Rules

* **Atomic Postings**: Every donation or expense creation runs within a Spring `@Transactional` boundary. If the double-entry journal balance fails (`debits != credits`), the entire transaction rolls back.
* **Duplicate Protection**:
  * Unique constraint on `physical_book_receipt_no` per receipt series to prevent double-logging manual receipts.
  * Unique constraint on `gpay_transaction_id` across all inflows to prevent duplicate entry of bank transfers.
* **Standardized Error Responses**:
  ```json
  {
    "timestamp": "2026-11-01T23:45:00Z",
    "status": 400,
    "error": "DUPLICATE_TRANSACTION_ID",
    "message": "GPay Transaction ID already logged on receipt RCT-2026-0042",
    "message_ta": "இந்த ஜிபே பரிவர்த்தனை எண் ஏற்கனவே ரசீது RCT-2026-0042 இல் பதிவு செய்யப்பட்டுள்ளது."
  }
  ```

---

## 10. Testing & Verification Strategy

1. **Accounting Verification**:
   * Unit tests verifying `Debit == Credit` balance enforcement for every transaction type.
   * Calculation tests verifying family drive balance: `Target - Sum(Installments) == Remaining Due`.
   * Segregation tests verifying that in-kind material donations do not increment cash in hand.
2. **Multi-Drive Isolation Tests**:
   * Verify that paying an installment for Drive 2 does not deduct from Drive 1 pending balance.
   * Verify that opted-out families are omitted from active collection targets.
3. **Audit Trail Verification**:
   * Verifying that modifying a donation generates an audit log record capturing original and new values with operator identity.
4. **Integration & API Tests**:
   * Spring Boot MockMvc / WebTestClient tests covering public access vs JWT-guarded routes.
5. **Frontend Localization & Grid Tests**:
   * Language toggle switching verification across all key views.
   * Search and filter accuracy on the master data grid.
