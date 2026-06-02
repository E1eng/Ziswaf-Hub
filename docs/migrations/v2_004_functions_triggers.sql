-- ============================================================================
-- v2 / 004 — Functions, triggers, helpers
-- ============================================================================

-- 4.1 calculate_priority_score
-- Auto-skoring berdasarkan metrics di mustahik_assessments
CREATE OR REPLACE FUNCTION calculate_priority_score(p_assessment_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_metrics JSONB;
    v_asnaf TEXT;
    v_score NUMERIC(6,2) := 0;
    v_income NUMERIC;
    v_dependents INT;
    v_housing TEXT;
BEGIN
    SELECT metrics, asnaf_category INTO v_metrics, v_asnaf
    FROM mustahik_assessments WHERE id = p_assessment_id;

    IF v_metrics IS NULL THEN
        RETURN 0;
    END IF;

    v_income := COALESCE((v_metrics->>'monthly_income')::numeric, 2000000);
    v_dependents := COALESCE((v_metrics->>'dependents')::int, 1);
    v_housing := COALESCE(v_metrics->>'housing', 'unknown');

    -- Income score (max 40): lower income = higher
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

    -- Housing (max 15)
    v_score := v_score + CASE v_housing
        WHEN 'homeless' THEN 15
        WHEN 'rental' THEN 10
        WHEN 'family' THEN 6
        WHEN 'owned' THEN 2
        WHEN 'own' THEN 2
        ELSE 5
    END;

    -- Persist hasilnya
    UPDATE mustahik_assessments
    SET priority_score = v_score, updated_at = NOW()
    WHERE id = p_assessment_id;

    RETURN v_score;
END;
$$;

-- Trigger: auto-hitung saat insert/update metrics atau asnaf_category
CREATE OR REPLACE FUNCTION trg_assessment_priority_fn()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_priority_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assessment_priority ON mustahik_assessments;
CREATE TRIGGER trg_assessment_priority
    AFTER INSERT OR UPDATE OF metrics, asnaf_category ON mustahik_assessments
    FOR EACH ROW
    EXECUTE FUNCTION trg_assessment_priority_fn();

-- 4.2 check_dedup
-- Helper untuk wizard alokasi: cek mustahik_id mana yang sudah pernah
-- terima assistance_type sama dalam periode overlap
CREATE OR REPLACE FUNCTION check_dedup(
    p_mustahik_ids UUID[],
    p_assistance_type TEXT,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS TABLE (
    mustahik_id UUID,
    source_institution_id UUID,
    source_institution_name TEXT,
    source_batch_id UUID,
    source_batch_code TEXT,
    source_assistance_type TEXT,
    source_period_start DATE,
    source_period_end DATE,
    source_amount NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        al.mustahik_id,
        al.institution_id,
        i.name,
        al.batch_id,
        b.batch_code,
        al.assistance_type,
        al.period_start,
        al.period_end,
        al.amount
    FROM assistance_log al
    JOIN institutions i ON i.id = al.institution_id
    JOIN disbursement_batches b ON b.id = al.batch_id
    WHERE al.mustahik_id = ANY(p_mustahik_ids)
      AND al.assistance_type = p_assistance_type
      AND daterange(al.period_start, al.period_end, '[]')
          && daterange(p_period_start, p_period_end, '[]')
    ORDER BY al.created_at DESC;
$$;

-- 4.3 batch → assistance_log writer
-- Saat batch.status berubah ke DISBURSED, otomatis tulis rows ke assistance_log
-- berdasarkan allocations yang terkait.
CREATE OR REPLACE FUNCTION trg_batch_writes_assistance_log_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_program programs%ROWTYPE;
BEGIN
    -- Hanya jalan saat transisi ke DISBURSED (atau RECEIVED dari status lebih awal)
    IF NEW.status NOT IN ('DISBURSED', 'RECEIVED') THEN
        RETURN NEW;
    END IF;
    IF OLD.status IN ('DISBURSED', 'RECEIVED') THEN
        -- Sudah pernah dicatat
        RETURN NEW;
    END IF;
    IF NEW.program_id IS NULL THEN
        -- Batch tanpa program (legacy/manual) — skip
        RETURN NEW;
    END IF;

    SELECT * INTO v_program FROM programs WHERE id = NEW.program_id;
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Insert assistance_log per allocation
    INSERT INTO assistance_log (
        mustahik_id, institution_id, program_id, allocation_id, batch_id,
        assistance_type, fund_type, amount,
        period_start, period_end
    )
    SELECT
        a.mustahik_id,
        v_program.institution_id,
        v_program.id,
        al.id,
        NEW.id,
        v_program.assistance_type,
        v_program.fund_type,
        al.amount,
        v_program.period_start,
        v_program.period_end
    FROM allocations al
    JOIN mustahik_assessments a ON a.id = al.assessment_id
    WHERE al.batch_id = NEW.id
      AND al.status = 'ALLOCATED';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_batch_writes_assistance_log ON disbursement_batches;
CREATE TRIGGER trg_batch_writes_assistance_log
    AFTER UPDATE OF status ON disbursement_batches
    FOR EACH ROW
    EXECUTE FUNCTION trg_batch_writes_assistance_log_fn();

-- 4.4 generate_donation_code
-- Helper untuk generate kode donasi unik bentuk D-YYYY-XXXXXX (alphanumeric)
CREATE OR REPLACE FUNCTION generate_donation_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
    v_year INT := EXTRACT(YEAR FROM NOW())::INT;
    v_attempt INT := 0;
BEGIN
    LOOP
        v_code := 'D-' || v_year || '-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 6));
        IF NOT EXISTS (SELECT 1 FROM donations WHERE donation_code = v_code) THEN
            RETURN v_code;
        END IF;
        v_attempt := v_attempt + 1;
        IF v_attempt > 10 THEN
            RAISE EXCEPTION 'Could not generate unique donation_code after 10 attempts';
        END IF;
    END LOOP;
END;
$$;

-- 4.5 generate_batch_code
CREATE OR REPLACE FUNCTION generate_batch_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
    v_year INT := EXTRACT(YEAR FROM NOW())::INT;
    v_attempt INT := 0;
BEGIN
    LOOP
        v_code := 'ZH-' || v_year || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
        IF NOT EXISTS (SELECT 1 FROM disbursement_batches WHERE batch_code = v_code) THEN
            RETURN v_code;
        END IF;
        v_attempt := v_attempt + 1;
        IF v_attempt > 10 THEN
            RAISE EXCEPTION 'Could not generate unique batch_code after 10 attempts';
        END IF;
    END LOOP;
END;
$$;

-- 4.6 generate_invite_code (field worker invite)
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
    v_attempt INT := 0;
BEGIN
    LOOP
        v_code := 'FW-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 6));
        IF NOT EXISTS (SELECT 1 FROM field_workers WHERE invite_code = v_code) THEN
            RETURN v_code;
        END IF;
        v_attempt := v_attempt + 1;
        IF v_attempt > 10 THEN
            RAISE EXCEPTION 'Could not generate unique invite_code after 10 attempts';
        END IF;
    END LOOP;
END;
$$;

-- 4.7 fund_pool_view — virtual view untuk donor tracker
-- Returns: institution_id, fund_type, total_donated, total_disbursed, balance
CREATE OR REPLACE VIEW fund_pool_view AS
WITH donation_pool AS (
    SELECT institution_id, fund_type, SUM(amount) AS total_donated
    FROM donations
    GROUP BY institution_id, fund_type
),
batch_pool AS (
    SELECT p.institution_id, p.fund_type, SUM(b.total_amount) AS total_disbursed
    FROM disbursement_batches b
    JOIN programs p ON p.id = b.program_id
    WHERE b.status IN ('DISBURSED', 'RECEIVED')
    GROUP BY p.institution_id, p.fund_type
)
SELECT
    COALESCE(dp.institution_id, bp.institution_id) AS institution_id,
    COALESCE(dp.fund_type, bp.fund_type) AS fund_type,
    COALESCE(dp.total_donated, 0) AS total_donated,
    COALESCE(bp.total_disbursed, 0) AS total_disbursed,
    COALESCE(dp.total_donated, 0) - COALESCE(bp.total_disbursed, 0) AS balance,
    CASE
        WHEN COALESCE(dp.total_donated, 0) > 0 THEN
            ROUND((COALESCE(bp.total_disbursed, 0) / dp.total_donated) * 100, 2)
        ELSE 0
    END AS disbursement_pct
FROM donation_pool dp
FULL OUTER JOIN batch_pool bp
    ON bp.institution_id = dp.institution_id AND bp.fund_type = dp.fund_type;
