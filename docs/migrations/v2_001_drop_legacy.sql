-- ============================================================================
-- v2 / 001 — Drop legacy tables (post ADR 0002 pivot)
-- ============================================================================
-- Aman dijalankan: tabel-tabel ini sudah tidak direferensikan oleh kode aktual
-- atau punya 0 rows, atau berisi data sintetis yang tidak relevan post-pivot.
-- ============================================================================

-- Drop materialized views & views legacy lebih dulu (bergantung tabel di bawah)
DROP MATERIALIZED VIEW IF EXISTS mv_collection_by_region_year CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_distribution_by_region_year CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_collection_monthly_trend CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_gap_analysis CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_wakaf_summary_by_province CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_institution_performance CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_kecamatan_ranking CASCADE;

-- Drop legacy data tables
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS distributions CASCADE;
DROP TABLE IF EXISTS bps_indicators CASCADE;
DROP TABLE IF EXISTS zakat_potential CASCADE;
DROP TABLE IF EXISTS kecamatan_indicators CASCADE;
DROP TABLE IF EXISTS wakaf_assets CASCADE;
DROP TABLE IF EXISTS wakaf_asset_types CASCADE;
DROP TABLE IF EXISTS wakaf_utilization_types CASCADE;

-- Drop tabel yang akan di-replace
DROP TABLE IF EXISTS mustahik_proposals CASCADE;
DROP TABLE IF EXISTS program_beneficiaries CASCADE;
DROP TABLE IF EXISTS audit_ledger CASCADE;

-- Drop legacy RPCs jika ada
DROP FUNCTION IF EXISTS calculate_priority_score(uuid) CASCADE;
DROP FUNCTION IF EXISTS trigger_calculate_priority() CASCADE;
DROP FUNCTION IF EXISTS refresh_all_materialized_views() CASCADE;
DROP FUNCTION IF EXISTS process_disbursement(uuid, numeric, text, text, text) CASCADE;
