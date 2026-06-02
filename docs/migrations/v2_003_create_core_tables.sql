-- ============================================================================
-- v2 / 003 — Core tables baru sesuai ADR 0002
-- ============================================================================

-- 3.1 institution_users — mapping auth.users ke institution + role
CREATE TABLE institution_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'reviewer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Satu user = satu lembaga (untuk fase awal, multi-tenancy nanti)
CREATE UNIQUE INDEX idx_institution_users_user ON institution_users(user_id);
CREATE INDEX idx_institution_users_inst ON institution_users(institution_id, role);

-- 3.2 field_workers — identity field worker (Telegram-based)
CREATE TABLE field_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,

    -- Telegram binding
    telegram_chat_id BIGINT,
    telegram_username TEXT,

    -- Onboarding
    invite_code TEXT,
    invite_expires_at TIMESTAMPTZ,
    invited_by UUID REFERENCES auth.users(id),

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'revoked')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ
);
-- Active field workers must have unique telegram_chat_id
CREATE UNIQUE INDEX idx_fw_telegram_active
    ON field_workers(telegram_chat_id)
    WHERE status = 'active' AND telegram_chat_id IS NOT NULL;
-- Pending invites must have unique invite_code
CREATE UNIQUE INDEX idx_fw_invite_pending
    ON field_workers(invite_code)
    WHERE status = 'pending' AND invite_code IS NOT NULL;
CREATE INDEX idx_fw_institution ON field_workers(institution_id, status);

-- 3.3 mustahik_registry — shared identity per NIK
CREATE TABLE mustahik_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nik VARCHAR(16) NOT NULL UNIQUE CHECK (nik ~ '^\d{16}$'),
    full_name TEXT NOT NULL,
    kecamatan_id UUID REFERENCES regions(id),

    -- Contact (opsional)
    phone TEXT,
    address TEXT,

    -- Lifecycle
    lifecycle_status TEXT NOT NULL DEFAULT 'active'
        CHECK (lifecycle_status IN ('active', 'graduated', 'deceased', 'moved', 'flagged_invalid')),
    lifecycle_changed_at TIMESTAMPTZ,
    lifecycle_changed_by UUID REFERENCES auth.users(id),
    lifecycle_reason TEXT,

    -- UU PDP consent
    pdp_consent_at TIMESTAMPTZ,
    pdp_consent_collected_by_institution_id UUID REFERENCES institutions(id),

    -- Audit
    first_registered_by_institution_id UUID REFERENCES institutions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mustahik_lifecycle ON mustahik_registry(lifecycle_status);
CREATE INDEX idx_mustahik_kecamatan ON mustahik_registry(kecamatan_id);

-- 3.4 mustahik_assessments — per-lembaga assessment & priority score
CREATE TABLE mustahik_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mustahik_id UUID NOT NULL REFERENCES mustahik_registry(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    -- Classification & metrics
    asnaf_category TEXT NOT NULL CHECK (asnaf_category IN (
        'fakir','miskin','amil','mualaf','riqab',
        'gharimin','fisabilillah','ibnu_sabil'
    )),
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- expected metrics shape: { monthly_income, dependents, housing, ... }
    priority_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    estimated_amount NUMERIC(20,2) NOT NULL DEFAULT 0,

    -- Workflow
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED')),
    source TEXT NOT NULL DEFAULT 'MANUAL'
        CHECK (source IN ('MANUAL', 'TELEGRAM', 'API', 'IMPORT')),
    field_worker_id UUID REFERENCES field_workers(id),

    -- Review
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,

    -- Field verification (kunjungan rumah)
    field_verified_at TIMESTAMPTZ,
    field_verified_by UUID REFERENCES field_workers(id),

    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Satu mustahik bisa di-assess multi-lembaga, tapi satu lembaga hanya satu assessment aktif
CREATE UNIQUE INDEX idx_assessments_unique_active
    ON mustahik_assessments(mustahik_id, institution_id)
    WHERE status IN ('PENDING', 'APPROVED');
CREATE INDEX idx_assessments_status_score
    ON mustahik_assessments(status, priority_score DESC);
CREATE INDEX idx_assessments_institution
    ON mustahik_assessments(institution_id, status);

-- 3.5 allocations — output wizard alokasi (link assessment → batch)
CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES mustahik_assessments(id),
    batch_id UUID REFERENCES disbursement_batches(id) ON DELETE SET NULL,

    amount NUMERIC(20,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'PLANNED'
        CHECK (status IN ('PLANNED', 'ALLOCATED', 'CANCELED')),

    -- Dedup override (full transparency)
    duplicate_override BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_reason TEXT,
    duplicate_overridden_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    allocated_at TIMESTAMPTZ
);
-- Satu assessment hanya boleh punya satu allocation aktif per program
CREATE UNIQUE INDEX idx_allocations_unique
    ON allocations(program_id, assessment_id)
    WHERE status IN ('PLANNED', 'ALLOCATED');
CREATE INDEX idx_allocations_batch ON allocations(batch_id);

-- 3.6 assistance_log — append-only source-of-truth dedup
CREATE TABLE assistance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mustahik_id UUID NOT NULL REFERENCES mustahik_registry(id),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    allocation_id UUID REFERENCES allocations(id) ON DELETE SET NULL,
    batch_id UUID NOT NULL REFERENCES disbursement_batches(id),

    assistance_type TEXT NOT NULL,
    fund_type TEXT NOT NULL CHECK (fund_type IN ('zakat','infaq','sedekah','wakaf','dskl')),
    amount NUMERIC(20,2) NOT NULL,

    -- Period overlap untuk dedup
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_period_log_valid CHECK (period_end >= period_start)
);
CREATE INDEX idx_assistance_lookup
    ON assistance_log(mustahik_id, assistance_type, period_start, period_end);
CREATE INDEX idx_assistance_institution
    ON assistance_log(institution_id, created_at DESC);
CREATE INDEX idx_assistance_batch ON assistance_log(batch_id);

-- 3.7 donations — donor receipt + auto-email kode lacak (pool model)
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_code TEXT NOT NULL UNIQUE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    -- Donor
    donor_name TEXT,
    donor_email TEXT,
    donor_phone TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,

    -- Amount & classification
    amount NUMERIC(20,2) NOT NULL CHECK (amount > 0),
    fund_type TEXT NOT NULL CHECK (fund_type IN ('zakat','infaq','sedekah','wakaf','dskl')),
    channel TEXT CHECK (channel IN ('transfer', 'cash', 'ewallet', 'payroll', 'lainnya')),

    -- Receipt status
    received_at TIMESTAMPTZ DEFAULT NOW(),
    email_sent_at TIMESTAMPTZ,
    email_error TEXT,

    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_donations_pool ON donations(institution_id, fund_type);
CREATE INDEX idx_donations_recent ON donations(institution_id, received_at DESC);

-- 3.8 audit_ledger — immutable event log (event-log style, beda dari schema lama)
CREATE TABLE audit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    actor_id UUID REFERENCES auth.users(id),
    institution_id UUID REFERENCES institutions(id),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_entity ON audit_ledger(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_ledger(action, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_ledger(actor_id, created_at DESC);
CREATE INDEX idx_audit_institution ON audit_ledger(institution_id, created_at DESC);
