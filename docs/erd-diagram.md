# ZISWAF Hub — Entity Relationship Diagram

> **Sumber kebenaran:** `docs/database-schema.sql` + `app/src/lib/supabase/database.types.ts`
> **Arsitektur:** Individual NIK targeting + greedy knapsack disbursement.

## Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     regions      │     │ institution_types│     │ ziswaf_categories│
│──────────────────│     │──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ name             │     │ code (UQ)        │     │ name             │
│ type ◄ provinsi /│     │ name             │     │ category         │
│      kab/kota /  │     └────────┬─────────┘     │ sort_order       │
│      kecamatan   │              │ 1:N           └──────────────────┘
│ parent_id (FK) ◄─│──┐           ▼
│ code             │  │   ┌──────────────────┐
└────────┬─────────┘  │   │   institutions   │
         │            │   │──────────────────│
         │ 1:N        │   │ id (PK)          │
         ▼            │   │ name             │
                      └──►│ institution_type │     ┌─────────────────────┐
                          │ region_id (FK) ──│────►│ distribution_sectors│
                          │ level            │     │─────────────────────│
                          └────────┬─────────┘     │ id (PK)             │
                                   │ 1:N           │ code (UQ), name     │
                                   ▼               └─────────────────────┘
                          ┌──────────────────┐         (used by analytics
                          │ collections      │          tables only)
                          │ distributions    │
                          │ (legacy aggregate)│
                          └──────────────────┘
```

## Core Flow (NIK Targeting)

```
┌─────────────────────────┐
│   mustahik_proposals    │   <── individual NIK proposals
│─────────────────────────│       (sources: MANUAL, TELEGRAM, API, IMPORT)
│ id (PK)                 │
│ nik (16 digit)          │
│ full_name               │
│ kecamatan_id (FK→regions│
│ asnaf_category          │   <── 8 asnaf classifier
│ metrics (JSONB)         │       income, dependents, housing
│ priority_score    ◄─────│   <── auto-computed by RPC trigger
│ allocated_amount        │
│ status: PENDING/        │
│   APPROVED/REJECTED/    │
│   DISBURSED             │
│ disbursement_batch_id ──┼──┐
│ source                  │  │
└─────────────────────────┘  │
                             │
┌─────────────────────────┐  │
│       programs          │  │   <── institutional programs
│─────────────────────────│  │       (RUTIN/PROPOSAL/INSIDENTIL)
│ id (PK)                 │  │
│ institution_id (FK)     │  │
│ name, program_type      │  │
│ target_asnaf (TEXT[])   │  │
│ sector, budget, period  │  │
│ beneficiary_target      │  │
│ status: DRAFT/ACTIVE/   │  │
│   COMPLETED             │  │
└─────────┬───────────────┘  │
          │ 1:N              │
          ▼                  │
┌─────────────────────────┐  │
│  program_beneficiaries  │  │
│─────────────────────────│  │
│ id (PK)                 │  │
│ program_id (FK)         │  │
│ disbursement_batch_id ──┼──┤
│ nik, full_name          │  │
│ asnaf_category          │  │
│ amount                  │  │
│ status: PENDING/        │  │
│   VALIDATED/DUPLICATE/  │  │
│   DISBURSED             │  │
│ duplicate_note          │  │
└─────────────────────────┘  │
                             │
┌─────────────────────────┐  │
│  disbursement_batches   │◄─┘   <── anonymized public tracking
│─────────────────────────│
│ id (PK)                 │
│ batch_code (UQ)         │
│ total_amount            │
│ beneficiary_count       │
│ fund_type, status       │   <── PROCESSING → VERIFIED →
│ kecamatan_summary (JSON)│       DISBURSED → RECEIVED
│ program_id (FK→programs)│
│ verified_at             │
│ disbursed_at            │
│ received_at             │
└─────────────────────────┘
```

## Audit & Compliance

```
┌─────────────────────────┐
│      audit_ledger       │   <── immutable event log
│─────────────────────────│       (INSERT-only via RLS)
│ id (PK)                 │
│ action                  │   e.g. PROPOSAL_APPROVED
│ entity_type             │   e.g. mustahik_proposal
│ entity_id (UUID)        │
│ actor_id                │
│ payload (JSONB)         │
│ created_at              │
└─────────────────────────┘
```

## Tabel Count

| Kategori | Tabel | Total |
|---|---|---|
| Reference | `regions`, `institution_types`, `institutions`, `ziswaf_categories`, `distribution_sectors` | 5 |
| Legacy aggregate | `collections`, `distributions` | 2 |
| Core flow | `programs`, `mustahik_proposals`, `program_beneficiaries`, `disbursement_batches` | 4 |
| Audit | `audit_ledger` | 1 |
| **Total** | | **12** |

## RLS Summary

| Tabel | anon SELECT | authenticated |
|---|---|---|
| `regions`, `institution_types`, `institutions`, `ziswaf_categories`, `distribution_sectors` | ✓ | ALL |
| `mustahik_proposals` | ✗ (PII) | ALL |
| `program_beneficiaries` | ✗ (PII) | ALL |
| `programs` | ✓ | ALL |
| `disbursement_batches` | ✓ (anonymized) | INSERT/UPDATE |
| `audit_ledger` | ✗ | INSERT only (no UPDATE/DELETE) |

## Status Lifecycles

**`mustahik_proposals.status`**
```
PENDING ──► APPROVED ──► DISBURSED
   └─────► REJECTED
```

**`disbursement_batches.status`** (Shopee-style timeline)
```
PROCESSING ──► VERIFIED ──► DISBURSED ──► RECEIVED
```

**`program_beneficiaries.status`**
```
PENDING ──► VALIDATED ──► DISBURSED
   └─────► DUPLICATE
```

**`programs.status`**
```
DRAFT ──► ACTIVE ──► COMPLETED
```
