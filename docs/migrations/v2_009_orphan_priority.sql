-- ============================================================================
-- v2 / 009 — Faktor yatim/piatu pada priority score
-- ============================================================================
--
-- Menambah bobot prioritas untuk anak yatim/piatu. Yatim BUKAN asnaf ke-9
-- (secara fiqih mereka masuk fakir/miskin), melainkan penanda kerentanan
-- tambahan yang disimpan di metrics->>'is_orphan'.
--
-- Perubahan skor:
--   - Total maksimum dinaikkan dari 100 → 110 (komponen yatim maks 10)
--   - Komponen yatim: +10 bila is_orphan = true
--
-- Idempotent: CREATE OR REPLACE, aman dijalankan berulang.

CREATE OR REPLACE FUNCTION public.calculate_priority_score(p_assessment_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
    v_metrics JSONB;
    v_asnaf TEXT;
    v_score NUMERIC(6,2) := 0;
    v_income NUMERIC;
    v_dependents INT;
    v_housing TEXT;
    v_is_orphan BOOLEAN;
BEGIN
    SELECT metrics, asnaf_category INTO v_metrics, v_asnaf
    FROM mustahik_assessments WHERE id = p_assessment_id;

    IF v_metrics IS NULL THEN
        RETURN 0;
    END IF;

    v_income := COALESCE((v_metrics->>'monthly_income')::numeric, 2000000);
    v_dependents := COALESCE((v_metrics->>'dependents')::int, 1);
    v_housing := COALESCE(v_metrics->>'housing', 'unknown');
    v_is_orphan := COALESCE((v_metrics->>'is_orphan')::boolean, false);

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

    -- Orphan vulnerability (max 10)
    IF v_is_orphan THEN
        v_score := v_score + 10;
    END IF;

    -- Persist hasilnya
    UPDATE mustahik_assessments
    SET priority_score = v_score, updated_at = NOW()
    WHERE id = p_assessment_id;

    RETURN v_score;
END;
$$;

-- Recompute skor semua assessment aktif agar konsisten dengan formula baru.
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT id FROM mustahik_assessments WHERE status IN ('PENDING','APPROVED')
    LOOP
        PERFORM calculate_priority_score(r.id);
    END LOOP;
END $$;
