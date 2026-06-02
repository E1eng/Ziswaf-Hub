-- ============================================================================
-- v2 / 002 — Alter tabel existing
-- ============================================================================

-- 2.1 institutions: tambah kolom bank_account untuk display donor receipt
ALTER TABLE institutions
    ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
    ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- 2.2 programs: drop tabel & re-create dengan schema baru
-- (tidak ada data — disbursement_batches FK & program_beneficiaries sudah di-drop)
DROP TABLE IF EXISTS programs CASCADE;

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    name TEXT NOT NULL,
    description TEXT,

    -- Multi-fund classification
    fund_type TEXT NOT NULL CHECK (fund_type IN ('zakat', 'infaq', 'sedekah', 'wakaf', 'dskl')),
    assistance_type TEXT NOT NULL CHECK (assistance_type IN (
        'sembako', 'beasiswa', 'modal_usaha', 'kesehatan',
        'tunai', 'pelatihan', 'dakwah', 'rumah_layak',
        'kemanusiaan', 'lainnya'
    )),
    target_asnaf TEXT[] NOT NULL DEFAULT '{}',
    sector TEXT,

    -- Budget & period
    budget NUMERIC(20,2) NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    beneficiary_target INT DEFAULT 0,

    -- Workflow
    program_type TEXT NOT NULL DEFAULT 'RUTIN'
        CHECK (program_type IN ('RUTIN', 'PROPOSAL', 'INSIDENTIL')),
    status TEXT NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELED')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Fiqih constraint: zakat & dskl harus ke 8 asnaf yang sah
    CONSTRAINT chk_fiqih_target_asnaf CHECK (
        CASE fund_type
            WHEN 'zakat' THEN target_asnaf <@ ARRAY[
                'fakir','miskin','amil','mualaf','riqab',
                'gharimin','fisabilillah','ibnu_sabil'
            ]::text[]
            WHEN 'dskl' THEN target_asnaf <@ ARRAY[
                'fakir','miskin','amil','mualaf','riqab',
                'gharimin','fisabilillah','ibnu_sabil'
            ]::text[]
            WHEN 'wakaf' THEN false  -- wakaf tidak via wizard (post-hackathon)
            ELSE true  -- infaq, sedekah bebas
        END
    ),
    CONSTRAINT chk_period_valid CHECK (period_end >= period_start)
);

CREATE INDEX idx_programs_institution_status ON programs(institution_id, status);
CREATE INDEX idx_programs_fund_type ON programs(fund_type) WHERE status = 'ACTIVE';
CREATE INDEX idx_programs_period ON programs(period_start, period_end) WHERE status = 'ACTIVE';

-- 2.3 disbursement_batches: ALTER untuk re-link FK ke programs
-- (program_id FK akan di-recreate; juga add institution_id untuk RLS)
ALTER TABLE disbursement_batches
    ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);

-- Re-add FK to new programs table
ALTER TABLE disbursement_batches
    DROP CONSTRAINT IF EXISTS disbursement_batches_program_id_fkey,
    ADD CONSTRAINT disbursement_batches_program_id_fkey
        FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

-- Pastikan kolom yang dipakai timeline sudah ada
ALTER TABLE disbursement_batches
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_batches_status ON disbursement_batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_institution ON disbursement_batches(institution_id, status);
