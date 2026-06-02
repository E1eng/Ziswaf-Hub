# ADR 0001 — Pivot ke Individual NIK Targeting

**Status:** Diterima
**Tanggal:** Mei 2026
**Konteks:** Hackathon Analytic ZISWAF, deadline September 2026

## Konteks

Versi awal ZISWAF Hub dirancang sebagai **kecamatan-level smart allocation**:
- Tabel `kecamatan_indicators` (6.455 records) menyimpan estimasi 8 asnaf per kecamatan
- Tabel `program_templates` (10 program standar)
- Engine `allocation_plans + allocation_plan_items` mendistribusi budget proporsional ke kecamatan dengan `priority_score` tertinggi

Setelah review domain expert, pendekatan ini punya 3 kelemahan untuk juri hackathon:

1. **Estimasi asnaf per kecamatan adalah angka sintetis** — tidak ada NIK yang bisa diverifikasi
2. **Tidak menjawab masalah duplikasi** — yang justru pain-point utama lembaga ZISWAF saat ini (Kemensos, BAZNAS, LAZ saling salurkan ke orang yang sama)
3. **Tracking publik per kecamatan terlalu vague** — donor mau tahu "dana saya sampai ke siapa", bukan "dana saya sampai ke kecamatan X"

## Keputusan

Pivot ke **individual NIK targeting**:

- Setiap mustahik adalah satu record `mustahik_proposals` dengan NIK 16-digit unik
- Skor prioritas dihitung otomatis oleh RPC `calculate_priority_score` berdasarkan: pendapatan, jumlah tanggungan, kategori asnaf, kondisi tempat tinggal
- Smart allocation = greedy knapsack: pilih individu dengan skor tertinggi sampai budget habis
- Lembaga juga bisa upload program-driven (bulk paste daftar penerima) lewat `program_beneficiaries` dengan validasi duplikat lintas-program & lintas-jalur
- Public tracking per `disbursement_batches` (anonim, kecamatan-level summary saja)

## Konsekuensi

**Positif**
- Anti-duplikasi enforcement di level NIK (unique index `idx_proposals_nik_active`)
- Privacy-first: NIK selalu di-mask di UI lewat `lib/utils/privacy.maskNik`
- Auditable trail per individu via `audit_ledger`
- Telegram webhook (`/api/telegram-webhook`) memungkinkan submission dari lapangan

**Trade-off yang diterima**
- Tabel kecamatan-aggregate (`kecamatan_indicators`, `allocation_plans`, `donation_batches` lama) di-drop — tidak ada lagi targeting agregat
- Halaman publik `/analitik` dan `/direktori` di-deprecate karena bergantung pada agregat MV yang tidak diseed lagi
- Halaman `/dashboard/input` (form catat collections/distributions) di-deprecate — tidak in core flow
- Janji "Treasury & 3rd-party integration (Midtrans/Xendit/Flip)" di-defer ke roadmap pasca-hackathon

## Perubahan Schema

**Drop**
- `kecamatan_indicators`, `allocation_plans`, `allocation_plan_items`, `program_templates`
- `donation_batches` (versi lama, kolom berbeda)
- `bps_indicators`, `zakat_potential`, `wakaf_assets`, `asnaf_categories` (reference table)
- 5 materialized views legacy

**Tambah**
- `mustahik_proposals` (individu)
- `disbursement_batches` (versi baru, status `PROCESSING/VERIFIED/DISBURSED/RECEIVED`)
- `program_beneficiaries`
- `programs` (versi baru, kolom `program_type`, `target_asnaf[]`, `sector`)
- `audit_ledger` (event-log style, immutable)

**Pertahankan**
- `regions`, `institutions`, `institution_types`, `ziswaf_categories`, `distribution_sectors`
- `collections`, `distributions` (untuk legacy analytics, tidak di-query oleh core flow)

## Referensi

- Schema canonical: [`docs/database-schema.sql`](../database-schema.sql)
- ERD: [`docs/erd-diagram.md`](../erd-diagram.md)
- Brief produk: [`INSTRUCTION.md`](../../INSTRUCTION.md)
