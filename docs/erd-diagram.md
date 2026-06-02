# ZISWAF Hub — Entity Relationship Diagram

> **Versi:** v2 (pasca ADR 0002)
> **Sumber kebenaran teknis:** `docs/database-schema.sql` + `app/src/lib/supabase/database.types.ts`
> **Arsitektur:** 3-layer — Data Input / Coordination / Public Transparency

---

## Domain Map

```
                            ┌──────────────────┐
                            │   institutions   │  ◄── multi-lembaga
                            │ - name, type     │      full transparency
                            │ - region_id      │      antar mereka
                            │ - bank_account   │
                            └──┬────────┬──────┘
                               │        │
                  ┌────────────┘        └──────────────┐
                  │ 1:N                                │ 1:N
                  ▼                                    ▼
          ┌──────────────────┐                ┌──────────────────┐
          │ institution_users│                │  field_workers   │
          │ - user_id (auth) │                │ - telegram_chat  │
          │ - role           │                │ - invite_code    │
          │   admin/super/   │                │ - status         │
          │   reviewer       │                │ - phone          │
          └──────────────────┘                └────────┬─────────┘
                                                       │ 1:N
                                                       ▼
                                                       │
                                              ┌────────┴─────────┐
                                              │  (submit asses)  │
                                              ▼                  │
                          ┌──────────────────────────┐           │
                          │  mustahik_assessments    │ ◄─────────┘
                          │ - mustahik_id            │     per-lembaga
                          │ - institution_id         │     snapshot
                          │ - asnaf_category         │
                          │ - metrics (jsonb)        │
                          │ - priority_score (auto)  │
                          │ - status PENDING/        │
                          │   APPROVED/REJECTED      │
                          │ - field_worker_id        │
                          │ - source                 │
                          └────┬─────────────────────┘
                               │ N:1
                               ▼
                          ┌──────────────────────────┐
                          │   mustahik_registry      │ ◄── SHARED
                          │ - id (PK)                │     identity tunggal
                          │ - nik (UNIQUE)           │     per-NIK
                          │ - full_name (encrypted)  │
                          │ - kecamatan_id           │
                          │ - lifecycle_status       │
                          │   active/graduated/      │
                          │   deceased/moved/        │
                          │   flagged_invalid        │
                          │ - pdp_consent_at         │
                          │ - consent_inst_id        │
                          └────┬─────────────────────┘
                               │
                               │ referenced by
                               ▼
                          ┌──────────────────────────┐
                          │   assistance_log         │ ◄── append-only
                          │ - mustahik_id            │     source-of-truth
                          │ - institution_id         │     untuk dedup
                          │ - assistance_type        │     cross-institution
                          │ - fund_type              │
                          │ - period_start/end       │
                          │ - amount                 │
                          │ - batch_id               │
                          │ - allocation_id          │
                          └──────────────────────────┘
                               ▲
                               │ written via trigger
                               │ (when batch.status → DISBURSED)
                               │
          ┌────────────────────┴───────────────────┐
          │                                        │
   ┌──────┴───────────┐                  ┌─────────┴──────────┐
   │   programs       │                  │ disbursement_      │
   │ - institution_id │                  │   batches          │
   │ - fund_type      │                  │ - batch_code (UQ)  │
   │   zakat/infaq/   │                  │ - status           │
   │   sedekah/wakaf/ │                  │   PROCESSING/      │
   │   dskl           │ 1:1              │   VERIFIED/        │
   │ - target_asnaf[] │ ────────────►    │   DISBURSED/       │
   │ - assistance_    │                  │   RECEIVED         │
   │   type           │                  │ - total_amount     │
   │ - period_start/  │                  │ - count            │
   │   end            │                  │ - program_id (FK)  │
   │ - budget         │                  │ - timestamps per   │
   │ - status         │                  │   status step      │
   │   DRAFT/ACTIVE/  │                  └────────▲───────────┘
   │   COMPLETED      │                           │
   └────┬─────────────┘                           │
        │ 1:N                                     │ N:1
        ▼                                         │
   ┌──────────────────┐                           │
   │   allocations    │ ──────────────────────────┘
   │ - program_id     │
   │ - assessment_id  │ ── points back to mustahik_assessments
   │ - amount         │
   │ - batch_id       │ ── populated when batch is created
   │ - status PLANNED/│
   │   ALLOCATED/     │
   │   CANCELED       │
   │ - dup_override?  │
   │ - dup_reason     │
   └──────────────────┘

   ┌──────────────────┐                ┌──────────────────────┐
   │   donations      │                │  (virtual view)      │
   │ - donation_code  │                │  fund_pool_view      │
   │   (UNIQUE PUBLIC)│                │  pool_balance =      │
   │ - donor_email    │                │    sum(donations) -  │
   │ - donor_name     │                │    sum(batches)      │
   │   (optional)     │                │  per (institution_id,│
   │ - amount         │                │       fund_type)     │
   │ - fund_type      │                └──────────────────────┘
   │ - institution_id │
   │ - channel        │
   │ - email_sent_at  │
   │ - notes          │
   └──────────────────┘

   ┌──────────────────┐
   │  audit_ledger    │ ◄── INSERT-only via RLS, immutable
   │ - action         │     mencatat semua state change
   │ - entity_type/id │     PROPOSAL_SUBMITTED, BATCH_CREATED,
   │ - actor_id       │     ALLOCATION_OVERRIDE_DUPLICATE, dst.
   │ - payload (json) │
   │ - created_at     │
   └──────────────────┘
```

---

## Tabel Count: 13

### Reference & Identity (4)
1. `regions` — wilayah Indonesia (provinsi/kabupaten/kota/kecamatan)
2. `institutions` — lembaga ZISWAF terdaftar
3. `institution_users` — mapping `auth.users` ke lembaga + role
4. `field_workers` — identity field worker (Telegram-based)

### Mustahik Domain (3)
5. `mustahik_registry` — shared identity per NIK
6. `mustahik_assessments` — per-lembaga assessment & priority score
7. `assistance_log` — append-only riwayat bantuan, sumber kebenaran dedup

### Coordination & Disbursement (4)
8. `programs` — kontainer alokasi cerdas, multi-fund + fiqih-aware
9. `allocations` — output wizard alokasi, link ke assessment + batch
10. `disbursement_batches` — anonymized public-trackable batch
11. `donations` — donor receipt + auto-email kode lacak

### Audit & Misc (2)
12. `audit_ledger` — INSERT-only event log
13. *(reserved)* — `program_beneficiaries` deprecated; bisa dipertahankan sebagai shortcut bulk paste atau dihapus

---

## Status Lifecycles

### `mustahik_assessments.status`
```
PENDING ──► APPROVED ──► (eligible untuk allocation)
   └─────► REJECTED
```

### `disbursement_batches.status` (Shopee-style timeline)
```
PROCESSING ──► VERIFIED ──► DISBURSED ──► RECEIVED
                                  │
                                  └─► trigger: write rows ke assistance_log
```

### `programs.status`
```
DRAFT ──► ACTIVE ──► COMPLETED
```

### `allocations.status`
```
PLANNED ──► ALLOCATED ──► (auto when batch DISBURSED)
   └─────► CANCELED
```

### `mustahik_registry.lifecycle_status`
```
active (default)
  ├──► graduated   — kondisi membaik, skip dari wizard
  ├──► deceased    — meninggal
  ├──► moved       — pindah ke wilayah lain
  └──► flagged_invalid — data terbukti tidak valid
```

---

## Constraint Fiqih (DB-level)

```sql
-- programs
CHECK (
  CASE fund_type
    WHEN 'zakat' THEN target_asnaf <@ ARRAY[
      'fakir','miskin','amil','mualaf','riqab',
      'gharimin','fisabilillah','ibnu_sabil'
    ]::text[]
    WHEN 'infaq' THEN true   -- bebas
    WHEN 'sedekah' THEN true -- bebas
    WHEN 'dskl' THEN target_asnaf <@ ARRAY[
      'fakir','miskin','amil','mualaf','riqab',
      'gharimin','fisabilillah','ibnu_sabil'
    ]::text[]
    WHEN 'wakaf' THEN false  -- wakaf tidak via wizard alokasi
    ELSE false
  END
)
```

UI form `/dashboard/program/new` filter dropdown `target_asnaf` berdasarkan `fund_type` yang dipilih, sehingga user tidak pernah submit kombinasi invalid.

---

## RLS Summary

| Tabel | anon SELECT | authenticated (institution_users) |
|---|---|---|
| `regions`, `institutions` | ✓ | ALL |
| `mustahik_registry`, `mustahik_assessments` | ✗ (PII) | ALL (full transparency antar lembaga) |
| `assistance_log` | ✗ (PII) | ALL (full transparency antar lembaga) |
| `programs` | ✓ (active only) | ALL untuk lembaga sendiri |
| `allocations` | ✗ | ALL untuk lembaga sendiri |
| `disbursement_batches` | ✓ (anonymized) | INSERT/UPDATE untuk lembaga sendiri |
| `donations` | ✗ | hanya untuk lembaga sendiri (donor email = PII) |
| `field_workers` | ✗ | hanya supervisor/admin lembaga sendiri |
| `institution_users` | ✗ | own row + admin lembaga sendiri |
| `audit_ledger` | ✗ | INSERT-only (UPDATE/DELETE diblokir oleh policy) |

---

## Key Indexes

```sql
-- Anti-duplicate aktif per NIK
CREATE UNIQUE INDEX idx_mustahik_nik ON mustahik_registry(nik);

-- Performance dedup query
CREATE INDEX idx_assistance_lookup
  ON assistance_log(mustahik_id, assistance_type, period_start, period_end);

-- Browse mustahik di dashboard
CREATE INDEX idx_assessments_status_score
  ON mustahik_assessments(status, priority_score DESC);

-- Donation tracking lookup
CREATE UNIQUE INDEX idx_donation_code ON donations(donation_code);

-- Pool view computation
CREATE INDEX idx_donations_pool ON donations(institution_id, fund_type);
CREATE INDEX idx_batches_pool ON disbursement_batches(program_id, status)
  WHERE status IN ('DISBURSED','RECEIVED');

-- Field worker auth
CREATE UNIQUE INDEX idx_fw_telegram ON field_workers(telegram_chat_id)
  WHERE status = 'active';
CREATE UNIQUE INDEX idx_fw_invite ON field_workers(invite_code)
  WHERE status = 'pending';

-- Audit traversal
CREATE INDEX idx_audit_entity ON audit_ledger(entity_type, entity_id, created_at DESC);
```

---

## Triggers & RPCs

| Nama | Fungsi |
|---|---|
| `trg_assessment_priority` | Auto-hitung `priority_score` saat insert/update `mustahik_assessments.metrics` |
| `trg_batch_to_assistance_log` | Saat `disbursement_batches.status → DISBURSED`, write rows ke `assistance_log` (per `allocations`) |
| `rpc_calculate_priority_score(assessment_id)` | Public function, bisa dipanggil manual jika perlu re-score |
| `rpc_check_dedup(mustahik_ids[], assistance_type, period_start, period_end)` | Helper untuk wizard alokasi, return list overlap dari `assistance_log` |
| `rpc_send_donation_email(donation_id)` | Trigger Resend/Supabase Email; tidak otomatis di trigger DB karena butuh network call |
| `audit_no_update`, `audit_no_delete` policies | Enforce immutability `audit_ledger` |
