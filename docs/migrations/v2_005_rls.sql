-- ============================================================================
-- v2 / 005 — Row Level Security policies
-- ============================================================================
-- Prinsip:
--   - Reference tables (regions, institutions, ziswaf_categories, dll): public read
--   - PII tables (mustahik_*, assistance_log, donations, field_workers): authenticated only
--   - Full transparency antar lembaga di mustahik_registry & assistance_log
--   - donations & field_workers: hanya untuk lembaga sendiri
--   - audit_ledger: INSERT only (UPDATE/DELETE blocked by absence of policies)
-- ============================================================================

-- Helper function: cek apakah user adalah anggota institution_users untuk inst tertentu
CREATE OR REPLACE FUNCTION is_member_of_institution(p_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM institution_users
        WHERE user_id = auth.uid() AND institution_id = p_institution_id
    );
$$;

-- Helper function: cek role minimum (admin > supervisor > reviewer)
CREATE OR REPLACE FUNCTION has_role_in_institution(p_institution_id UUID, p_min_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM institution_users
        WHERE user_id = auth.uid()
          AND institution_id = p_institution_id
          AND CASE p_min_role
              WHEN 'admin' THEN role = 'admin'
              WHEN 'supervisor' THEN role IN ('admin', 'supervisor')
              WHEN 'reviewer' THEN role IN ('admin', 'supervisor', 'reviewer')
              ELSE FALSE
          END
    );
$$;

-- ============================================================================
-- Reference tables — public read
-- ============================================================================

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS regions_public_read ON regions;
CREATE POLICY regions_public_read ON regions
    FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS institutions_public_read ON institutions;
DROP POLICY IF EXISTS institutions_admin_update ON institutions;
CREATE POLICY institutions_public_read ON institutions
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY institutions_admin_update ON institutions
    FOR UPDATE TO authenticated
    USING (has_role_in_institution(id, 'admin'))
    WITH CHECK (has_role_in_institution(id, 'admin'));

ALTER TABLE institution_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS institution_types_public_read ON institution_types;
CREATE POLICY institution_types_public_read ON institution_types
    FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE ziswaf_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ziswaf_categories_public_read ON ziswaf_categories;
CREATE POLICY ziswaf_categories_public_read ON ziswaf_categories
    FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE distribution_sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS distribution_sectors_public_read ON distribution_sectors;
CREATE POLICY distribution_sectors_public_read ON distribution_sectors
    FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE asnaf_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS asnaf_categories_public_read ON asnaf_categories;
CREATE POLICY asnaf_categories_public_read ON asnaf_categories
    FOR SELECT TO anon, authenticated USING (true);

-- ============================================================================
-- institution_users — own row + admin di lembaga sendiri
-- ============================================================================
ALTER TABLE institution_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS iu_self_read ON institution_users;
DROP POLICY IF EXISTS iu_admin_all ON institution_users;
CREATE POLICY iu_self_read ON institution_users
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR has_role_in_institution(institution_id, 'admin'));
CREATE POLICY iu_admin_manage ON institution_users
    FOR ALL TO authenticated
    USING (has_role_in_institution(institution_id, 'admin'))
    WITH CHECK (has_role_in_institution(institution_id, 'admin'));

-- ============================================================================
-- field_workers — supervisor & admin lembaga sendiri
-- ============================================================================
ALTER TABLE field_workers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fw_supervisor_all ON field_workers;
CREATE POLICY fw_supervisor_all ON field_workers
    FOR ALL TO authenticated
    USING (has_role_in_institution(institution_id, 'supervisor'))
    WITH CHECK (has_role_in_institution(institution_id, 'supervisor'));

-- ============================================================================
-- mustahik_registry — full transparency antar lembaga (PII)
-- Semua institution_users boleh SELECT. INSERT/UPDATE oleh anggota lembaga manapun.
-- ============================================================================
ALTER TABLE mustahik_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mr_authenticated_read ON mustahik_registry;
DROP POLICY IF EXISTS mr_authenticated_write ON mustahik_registry;
DROP POLICY IF EXISTS mr_authenticated_update ON mustahik_registry;
CREATE POLICY mr_authenticated_read ON mustahik_registry
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM institution_users WHERE user_id = auth.uid())
    );
CREATE POLICY mr_authenticated_write ON mustahik_registry
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM institution_users WHERE user_id = auth.uid())
    );
CREATE POLICY mr_authenticated_update ON mustahik_registry
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM institution_users WHERE user_id = auth.uid())
    );

-- ============================================================================
-- mustahik_assessments — full transparency read; write hanya untuk lembaga sendiri
-- ============================================================================
ALTER TABLE mustahik_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ma_transparent_read ON mustahik_assessments;
DROP POLICY IF EXISTS ma_own_institution_write ON mustahik_assessments;
CREATE POLICY ma_transparent_read ON mustahik_assessments
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM institution_users WHERE user_id = auth.uid())
    );
CREATE POLICY ma_own_institution_write ON mustahik_assessments
    FOR ALL TO authenticated
    USING (is_member_of_institution(institution_id))
    WITH CHECK (is_member_of_institution(institution_id));

-- ============================================================================
-- programs — public read for ACTIVE; CRUD untuk lembaga sendiri
-- ============================================================================
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS programs_public_read ON programs;
DROP POLICY IF EXISTS programs_own_inst ON programs;
CREATE POLICY programs_public_read ON programs
    FOR SELECT TO anon USING (status = 'ACTIVE');
CREATE POLICY programs_own_inst ON programs
    FOR ALL TO authenticated
    USING (is_member_of_institution(institution_id))
    WITH CHECK (is_member_of_institution(institution_id));

-- ============================================================================
-- allocations — hanya untuk lembaga sendiri (via program_id)
-- ============================================================================
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allocations_own_inst ON allocations;
CREATE POLICY allocations_own_inst ON allocations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = allocations.program_id
              AND is_member_of_institution(p.institution_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = allocations.program_id
              AND is_member_of_institution(p.institution_id)
        )
    );

-- ============================================================================
-- assistance_log — full transparency read antar lembaga (anti-duplikasi)
-- Insert via trigger DB; UPDATE/DELETE blocked (immutable audit)
-- ============================================================================
ALTER TABLE assistance_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS al_transparent_read ON assistance_log;
DROP POLICY IF EXISTS al_insert_authenticated ON assistance_log;
CREATE POLICY al_transparent_read ON assistance_log
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM institution_users WHERE user_id = auth.uid())
    );
-- Insert dilakukan oleh trigger DB; tetap allow untuk service_role
CREATE POLICY al_insert_authenticated ON assistance_log
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM institution_users WHERE user_id = auth.uid())
    );
-- Tidak ada UPDATE/DELETE policy → operasi tersebut diblokir

-- ============================================================================
-- disbursement_batches — public read (anonymized), CRUD untuk lembaga sendiri
-- ============================================================================
ALTER TABLE disbursement_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS db_public_read ON disbursement_batches;
DROP POLICY IF EXISTS db_own_inst ON disbursement_batches;
CREATE POLICY db_public_read ON disbursement_batches
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY db_own_inst ON disbursement_batches
    FOR ALL TO authenticated
    USING (
        institution_id IS NULL
        OR is_member_of_institution(institution_id)
    )
    WITH CHECK (
        institution_id IS NULL
        OR is_member_of_institution(institution_id)
    );

-- ============================================================================
-- donations — hanya untuk lembaga sendiri (donor email = PII)
-- Public anon TIDAK boleh lihat donations table; mereka query via /lacak
-- yang internally pakai service_role
-- ============================================================================
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS donations_own_inst ON donations;
CREATE POLICY donations_own_inst ON donations
    FOR ALL TO authenticated
    USING (is_member_of_institution(institution_id))
    WITH CHECK (is_member_of_institution(institution_id));

-- ============================================================================
-- audit_ledger — INSERT-only, immutable
-- ============================================================================
ALTER TABLE audit_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_select_authenticated ON audit_ledger;
DROP POLICY IF EXISTS audit_insert_authenticated ON audit_ledger;
CREATE POLICY audit_select_authenticated ON audit_ledger
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM institution_users WHERE user_id = auth.uid())
    );
CREATE POLICY audit_insert_authenticated ON audit_ledger
    FOR INSERT TO authenticated WITH CHECK (true);
-- Tidak ada UPDATE/DELETE policy → operasi tersebut diblokir
