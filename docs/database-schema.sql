-- ============================================================================
-- ZISWAF Hub — Database Schema (Canonical)
-- ============================================================================
-- Single source of truth. Match exactly with app/src/lib/supabase/database.types.ts
-- Run order:
--   1. Execute this file in Supabase SQL Editor (idempotent — safe to re-run)
--   2. Run python data/seed/main.py to populate reference data
--
-- Architecture: Individual NIK targeting + greedy knapsack disbursement
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- REFERENCE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('provinsi', 'kabupaten', 'kota', 'kecamatan')),
    parent_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_type ON regions(type);

CREATE TABLE IF NOT EXISTS institution_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    institution_type_id UUID NOT NULL REFERENCES institution_types(id),
    level TEXT NOT NULL CHECK (level IN ('nasional', 'provinsi', 'kabupaten_kota')),
    region_id UUID REFERENCES regions(id),
    license_number TEXT,
    established_year INT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ziswaf_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('zakat', 'infaq', 'sedekah', 'wakaf', 'dskl')),
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS distribution_sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    sort_order INT DEFAULT 0
);

-- ============================================================
-- LEGACY DATA TABLES (still populated for analytics; not in core flow)
-- ============================================================

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    region_id UUID NOT NULL REFERENCES regions(id),
    ziswaf_category_id UUID NOT NULL REFERENCES ziswaf_categories(id),
    year INT NOT NULL,
    month INT CHECK (month BETWEEN 1 AND 12),
    amount NUMERIC(20,2) DEFAULT 0,
    donor_count INT,
    donor_source TEXT,
    collection_channel TEXT,
    is_off_balance_sheet BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_collections_institution_year ON collections(institution_id, year);

CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    region_id UUID NOT NULL REFERENCES regions(id),
    sector_id UUID NOT NULL REFERENCES distribution_sectors(id),
    program_id UUID,
    asnaf_category_id UUID,
    year INT NOT NULL,
    month INT CHECK (month BETWEEN 1 AND 12),
    amount NUMERIC(20,2) DEFAULT 0,
    beneficiary_count INT,
    distribution_type TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_distributions_institution_year ON distributions(institution_id, year);

-- ============================================================
-- CORE FLOW: PROGRAM → BENEFICIARIES → BATCH
-- ============================================================

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id),
    name TEXT NOT NULL,
    program_type TEXT NOT NULL CHECK (program_type IN ('RUTIN', 'PROPOSAL', 'INSIDENTIL')),
    target_asnaf TEXT[] NOT NULL DEFAULT '{}',
    sector TEXT,
    budget NUMERIC(20,2) DEFAULT 0,
    period TEXT,
    beneficiary_target INT DEFAULT 0,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- Mustahik proposals — individual NIK-based targeting
CREATE TABLE IF NOT EXISTS mustahik_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nik VARCHAR(16) NOT NULL,
    full_name TEXT NOT NULL,
    kecamatan_id UUID REFERENCES regions(id),
    asnaf_category VARCHAR(30) NOT NULL CHECK (asnaf_category IN (
        'fakir', 'miskin', 'amil', 'mualaf', 'riqab', 'gharimin', 'fisabilillah', 'ibnu_sabil'
    )),
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority_score NUMERIC(6,2) DEFAULT 0,
    allocated_amount NUMERIC(20,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'DISBURSED'
    )),
    disbursement_batch_id UUID,
    source VARCHAR(30) DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'TELEGRAM', 'API', 'IMPORT')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- One active proposal per NIK
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_nik_active
    ON mustahik_proposals(nik) WHERE status NOT IN ('REJECTED', 'DISBURSED');
CREATE INDEX IF NOT EXISTS idx_proposals_status ON mustahik_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_priority ON mustahik_proposals(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_kecamatan ON mustahik_proposals(kecamatan_id);

-- Disbursement batches — anonymized, public-trackable
CREATE TABLE IF NOT EXISTS disbursement_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code VARCHAR(30) UNIQUE NOT NULL,
    total_amount NUMERIC(20,2) NOT NULL DEFAULT 0,
    beneficiary_count INT NOT NULL DEFAULT 0,
    fund_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING' CHECK (status IN (
        'PROCESSING', 'VERIFIED', 'DISBURSED', 'RECEIVED'
    )),
    kecamatan_summary JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    program_id UUID REFERENCES programs(id),
    verified_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batches_status ON disbursement_batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_program ON disbursement_batches(program_id);

-- Backfill FK from proposals to batches now that the table exists
ALTER TABLE mustahik_proposals
    DROP CONSTRAINT IF EXISTS mustahik_proposals_disbursement_batch_id_fkey;
ALTER TABLE mustahik_proposals
    ADD CONSTRAINT mustahik_proposals_disbursement_batch_id_fkey
    FOREIGN KEY (disbursement_batch_id) REFERENCES disbursement_batches(id);

-- Program beneficiaries — bulk-paste workflow for institutional programs
CREATE TABLE IF NOT EXISTS program_beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    disbursement_batch_id UUID REFERENCES disbursement_batches(id),
    nik VARCHAR(16) NOT NULL,
    full_name TEXT NOT NULL,
    asnaf_category VARCHAR(30) NOT NULL,
    amount NUMERIC(20,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'VALIDATED', 'DUPLICATE', 'DISBURSED'
    )),
    duplicate_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_program ON program_beneficiaries(program_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_nik ON program_beneficiaries(nik);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON program_beneficiaries(status);

-- ============================================================
-- AUDIT LEDGER (event-log style — immutable)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    actor_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_ledger(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_ledger(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_ledger(created_at DESC);

-- Lock immutability: only INSERT allowed
ALTER TABLE audit_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_select_all ON audit_ledger;
DROP POLICY IF EXISTS audit_insert_authenticated ON audit_ledger;
DROP POLICY IF EXISTS audit_no_update ON audit_ledger;
DROP POLICY IF EXISTS audit_no_delete ON audit_ledger;
CREATE POLICY audit_select_all ON audit_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY audit_insert_authenticated ON audit_ledger FOR INSERT TO authenticated WITH CHECK (true);
-- No UPDATE/DELETE policies → operations are blocked

-- ============================================================
-- RPC: calculate_priority_score (auto-scoring for proposals)
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_priority_score(p_proposal_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_metrics JSONB;
    v_asnaf VARCHAR;
    v_score NUMERIC(6,2) := 0;
    v_income NUMERIC;
    v_dependents INT;
BEGIN
    SELECT metrics, asnaf_category INTO v_metrics, v_asnaf
    FROM mustahik_proposals WHERE id = p_proposal_id;

    IF v_metrics IS NULL THEN RETURN 0; END IF;

    v_income := COALESCE((v_metrics->>'monthly_income')::numeric, 2000000);
    v_dependents := COALESCE((v_metrics->>'dependents')::int, 1);

    -- Income score (max 40): lower income = higher score
    v_score := v_score + GREATEST(0, LEAST(40, (2000000 - v_income) / 50000));

    -- Dependents (max 25)
    v_score := v_score + LEAST(25, v_dependents * 5);

    -- Asnaf weight (max 20)
    v_score := v_score + CASE v_asnaf
        WHEN 'fakir' THEN 20
        WHEN 'miskin' THEN 18
        WHEN 'gharimin' THEN 15
        WHEN 'ibnu_sabil' THEN 12
        WHEN 'mualaf' THEN 10
        WHEN 'fisabilillah' THEN 8
        WHEN 'riqab' THEN 8
        WHEN 'amil' THEN 5
        ELSE 5
    END;

    -- Housing condition (max 15)
    v_score := v_score + CASE COALESCE(v_metrics->>'housing', 'unknown')
        WHEN 'homeless' THEN 15
        WHEN 'rental' THEN 10
        WHEN 'family' THEN 6
        WHEN 'owned' THEN 2
        WHEN 'own' THEN 2
        ELSE 5
    END;

    UPDATE mustahik_proposals SET priority_score = v_score, updated_at = NOW()
    WHERE id = p_proposal_id;

    RETURN v_score;
END;
$$;

-- Trigger: auto-calculate on insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_priority()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_priority_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proposal_priority ON mustahik_proposals;
CREATE TRIGGER trg_proposal_priority
    AFTER INSERT OR UPDATE OF metrics, asnaf_category ON mustahik_proposals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_priority();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE mustahik_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS proposals_select ON mustahik_proposals;
DROP POLICY IF EXISTS proposals_insert ON mustahik_proposals;
DROP POLICY IF EXISTS proposals_update ON mustahik_proposals;
DROP POLICY IF EXISTS proposals_anon_no_pii ON mustahik_proposals;
CREATE POLICY proposals_select ON mustahik_proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY proposals_insert ON mustahik_proposals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY proposals_update ON mustahik_proposals FOR UPDATE TO authenticated USING (true);
-- Public anon explicitly blocked from PII
CREATE POLICY proposals_anon_no_pii ON mustahik_proposals FOR SELECT TO anon USING (false);

ALTER TABLE program_beneficiaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS beneficiaries_authenticated_all ON program_beneficiaries;
DROP POLICY IF EXISTS beneficiaries_anon_no_pii ON program_beneficiaries;
CREATE POLICY beneficiaries_authenticated_all ON program_beneficiaries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY beneficiaries_anon_no_pii ON program_beneficiaries FOR SELECT TO anon USING (false);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS programs_authenticated_all ON programs;
DROP POLICY IF EXISTS programs_public_read ON programs;
CREATE POLICY programs_authenticated_all ON programs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY programs_public_read ON programs FOR SELECT TO anon USING (true);

ALTER TABLE disbursement_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS batches_public_read ON disbursement_batches;
DROP POLICY IF EXISTS batches_update ON disbursement_batches;
DROP POLICY IF EXISTS batches_insert ON disbursement_batches;
-- Public CAN read batches (anonymized — no PII)
CREATE POLICY batches_public_read ON disbursement_batches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY batches_insert ON disbursement_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY batches_update ON disbursement_batches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Reference tables: public read only
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS regions_public_read ON regions;
CREATE POLICY regions_public_read ON regions FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS institutions_public_read ON institutions;
CREATE POLICY institutions_public_read ON institutions FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE institution_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS institution_types_public_read ON institution_types;
CREATE POLICY institution_types_public_read ON institution_types FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE ziswaf_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ziswaf_categories_public_read ON ziswaf_categories;
CREATE POLICY ziswaf_categories_public_read ON ziswaf_categories FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE distribution_sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS distribution_sectors_public_read ON distribution_sectors;
CREATE POLICY distribution_sectors_public_read ON distribution_sectors FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS collections_authenticated ON collections;
CREATE POLICY collections_authenticated ON collections FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS distributions_authenticated ON distributions;
CREATE POLICY distributions_authenticated ON distributions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SEED: institution types & ziswaf categories & distribution sectors
-- ============================================================

INSERT INTO institution_types (code, name, description) VALUES
    ('BAZNAS', 'BAZNAS', 'Badan Amil Zakat Nasional'),
    ('LAZ', 'LAZ', 'Lembaga Amil Zakat'),
    ('UPZ', 'UPZ', 'Unit Pengumpul Zakat'),
    ('NAZHIR', 'Nazhir Wakaf', 'Pengelola aset wakaf')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ziswaf_categories (name, category, sort_order) VALUES
    ('Zakat Fitrah', 'zakat', 1),
    ('Zakat Maal', 'zakat', 2),
    ('Zakat Penghasilan', 'zakat', 3),
    ('Infaq', 'infaq', 4),
    ('Sedekah', 'sedekah', 5),
    ('Wakaf Uang', 'wakaf', 6),
    ('Wakaf Tanah', 'wakaf', 7),
    ('DSKL', 'dskl', 8)
ON CONFLICT DO NOTHING;

INSERT INTO distribution_sectors (code, name, sort_order) VALUES
    ('ekonomi', 'Ekonomi', 1),
    ('pendidikan', 'Pendidikan', 2),
    ('kesehatan', 'Kesehatan', 3),
    ('kemanusiaan', 'Kemanusiaan', 4),
    ('dakwah', 'Dakwah & Advokasi', 5)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
-- Next steps:
--   1. Run python data/seed/main.py to seed regions + sample mustahik proposals
--   2. Verify: SELECT count(*) FROM mustahik_proposals;
-- ============================================================
