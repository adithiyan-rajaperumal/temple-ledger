-- =============================================================================
-- V1__init_schema.sql: Initial Database Schema for Temple Ledger System
-- Target: PostgreSQL 15+ (Compatible with Supabase / RDS / Docker)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Custom ENUM Types
-- -----------------------------------------------------------------------------

CREATE TYPE account_type AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'INCOME',
    'EXPENSE'
);

CREATE TYPE pledge_type AS ENUM (
    'MONETARY',
    'IN_KIND_MATERIAL',
    'HYBRID'
);

CREATE TYPE pledge_status AS ENUM (
    'PENDING',
    'PARTIALLY_FULFILLED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE drive_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'COMPLETED',
    'ARCHIVED'
);

CREATE TYPE commitment_status AS ENUM (
    'PARTICIPATING',
    'OPTED_OUT',
    'EXEMPTED'
);

CREATE TYPE payment_mode AS ENUM (
    'CASH',
    'GPAY_ONLINE',
    'IN_KIND'
);

CREATE TYPE donation_source AS ENUM (
    'VILLAGE_FAMILY_DRIVE',
    'GENERAL_PUBLIC'
);

CREATE TYPE expense_category AS ENUM (
    'MATERIAL_PURCHASE',
    'LABOUR_WAGES',
    'CONTRACT_PAYOUT',
    'COLLECTION_FIELD_EXPENSE',
    'TEMPLE_RITUAL_MISC'
);

CREATE TYPE user_role AS ENUM (
    'ROLE_SUPER_ADMIN',
    'ROLE_DATA_ENTRY'
);

-- -----------------------------------------------------------------------------
-- 4.1 Chart of Accounts & General Ledger (Double-Entry Core)
-- -----------------------------------------------------------------------------

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    name_ta VARCHAR(128),
    type account_type NOT NULL,
    parent_id UUID REFERENCES accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(64) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(64) NOT NULL,
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

-- -----------------------------------------------------------------------------
-- 4.2 Families, Drives, Allocations & Pledges
-- -----------------------------------------------------------------------------

CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_code VARCHAR(32) UNIQUE NOT NULL,
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

CREATE TABLE drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    name_ta VARCHAR(128),
    default_target_per_family NUMERIC(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status drive_status DEFAULT 'ACTIVE',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE drive_family_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    target_amount NUMERIC(12, 2) NOT NULL,
    status commitment_status DEFAULT 'PARTICIPATING',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_drive_family UNIQUE (drive_id, family_id)
);

CREATE TABLE pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pledge_code VARCHAR(32) UNIQUE NOT NULL,
    pledge_date DATE NOT NULL,
    pledge_type pledge_type NOT NULL DEFAULT 'MONETARY',
    donor_name VARCHAR(128) NOT NULL,
    donor_name_ta VARCHAR(128),
    village VARCHAR(128),
    phone VARCHAR(20),
    family_id UUID REFERENCES families(id),
    drive_id UUID REFERENCES drives(id),
    target_monetary_amount NUMERIC(12, 2) DEFAULT 0.00,
    target_material_desc TEXT,
    target_material_qty NUMERIC(10, 2) DEFAULT 0.00,
    target_material_unit VARCHAR(32),
    status pledge_status DEFAULT 'PENDING',
    notes TEXT,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4.3 Inflows: Donations & In-Kind Materials
-- -----------------------------------------------------------------------------

CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no VARCHAR(64) UNIQUE NOT NULL,
    donation_date DATE NOT NULL,
    donor_source donation_source NOT NULL,
    family_id UUID REFERENCES families(id),
    drive_id UUID REFERENCES drives(id),
    pledge_id UUID REFERENCES pledges(id),
    donor_name VARCHAR(128) NOT NULL,
    donor_name_ta VARCHAR(128),
    village VARCHAR(128),
    phone VARCHAR(20),
    payment_mode payment_mode NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    physical_book_receipt_no VARCHAR(64),
    gpay_transaction_id VARCHAR(64),
    notes TEXT,
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE in_kind_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID UNIQUE REFERENCES donations(id) ON DELETE CASCADE,
    item_category VARCHAR(64) NOT NULL,
    item_description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    approximate_unit_rate NUMERIC(10, 2) NOT NULL,
    total_estimated_value NUMERIC(12, 2) NOT NULL,
    storage_location VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4.4 Outflows: Contractors & Renovation Expenses
-- -----------------------------------------------------------------------------

CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_name VARCHAR(128) NOT NULL,
    trade VARCHAR(64) NOT NULL,
    phone VARCHAR(20),
    total_agreed_amount NUMERIC(14, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_no VARCHAR(64) UNIQUE NOT NULL,
    expense_date DATE NOT NULL,
    category expense_category NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode payment_mode NOT NULL DEFAULT 'CASH',
    paid_to VARCHAR(128) NOT NULL,
    contractor_id UUID REFERENCES contractors(id),
    contract_milestone_desc VARCHAR(128),
    volunteer_name VARCHAR(128),
    travel_mode_vehicle VARCHAR(64),
    invoice_bill_no VARCHAR(64),
    description TEXT NOT NULL,
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4.5 Security & Audit Trail
-- -----------------------------------------------------------------------------

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
    entity_name VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(16) NOT NULL,
    performed_by VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45),
    before_state JSONB,
    after_state JSONB,
    change_reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Indexes for Performance
-- -----------------------------------------------------------------------------

CREATE INDEX idx_journal_postings_entry_id ON journal_postings(journal_entry_id);
CREATE INDEX idx_journal_postings_account_id ON journal_postings(account_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_pledges_family_id ON pledges(family_id);
CREATE INDEX idx_pledges_drive_id ON pledges(drive_id);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_drive_family_alloc_drive ON drive_family_allocations(drive_id);
CREATE INDEX idx_drive_family_alloc_family ON drive_family_allocations(family_id);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_family_id ON donations(family_id);
CREATE INDEX idx_donations_drive_id ON donations(drive_id);
CREATE INDEX idx_donations_pledge_id ON donations(pledge_id);
CREATE INDEX idx_donations_journal_entry ON donations(journal_entry_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_contractor_id ON expenses(contractor_id);
CREATE INDEX idx_expenses_journal_entry ON expenses(journal_entry_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
