"""
ZISWAF Hub — Data Seeder

Seed minimal data untuk arsitektur individual NIK targeting:
  1. 34 Provinsi (regions, type='provinsi')
  2. Sample mustahik proposals (untuk demo dashboard)

Reference data (institution_types, ziswaf_categories, distribution_sectors)
sudah di-seed otomatis oleh `docs/database-schema.sql` saat di-apply.

Usage:
    python -m seed.main                 # Full seed
    python -m seed.main --reset         # Drop seeded data first, then re-seed
    python -m seed.main --only regions  # Seed specific tables only
                                          (regions, proposals)
"""
from __future__ import annotations

import argparse
import logging
import sys
import time

from supabase import create_client

from seed.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, BATCH_SIZE
from seed.sources.regions import PROVINCES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Sample mustahik proposals (15 records) ──
SAMPLE_PROPOSALS = [
    ("3201010101000001", "Ahmad Fauzi",      "fakir",        300_000, 5, "rental",   3_700_000, "PENDING",  "TELEGRAM"),
    ("3201010101000002", "Siti Aminah",      "miskin",       800_000, 3, "rental",   2_600_000, "PENDING",  "TELEGRAM"),
    ("3201010101000003", "Budi Santoso",     "gharimin",   1_200_000, 2, "family",   1_800_000, "PENDING",  "MANUAL"),
    ("3201010101000004", "Dewi Kartini",     "fakir",        200_000, 6, "homeless", 4_000_000, "APPROVED", "TELEGRAM"),
    ("3201010101000005", "Rahmat Hidayat",   "miskin",       600_000, 4, "rental",   2_900_000, "APPROVED", "MANUAL"),
    ("3201010101000006", "Nur Hasanah",      "ibnu_sabil",         0, 1, "homeless", 1_500_000, "APPROVED", "TELEGRAM"),
    ("3201010101000007", "Irfan Maulana",    "fakir",        400_000, 3, "rental",   3_100_000, "APPROVED", "MANUAL"),
    ("3201010101000008", "Aisyah Putri",     "miskin",       900_000, 2, "family",   2_300_000, "APPROVED", "TELEGRAM"),
    ("3201010101000009", "Zainal Abidin",    "gharimin",   1_500_000, 4, "owned",    2_100_000, "APPROVED", "MANUAL"),
    ("3201010101000010", "Fatimah Zahra",    "mualaf",       700_000, 1, "rental",   1_300_000, "APPROVED", "TELEGRAM"),
    ("3201010101000011", "Hasan Basri",      "fakir",        100_000, 7, "homeless", 4_300_000, "APPROVED", "TELEGRAM"),
    ("3201010101000012", "Khadijah Noor",    "miskin",       500_000, 5, "rental",   3_200_000, "APPROVED", "MANUAL"),
    ("3201010101000013", "Omar Faruk",       "fisabilillah",1_000_000,2, "family",   1_100_000, "PENDING",  "MANUAL"),
    ("3201010101000014", "Zainab Ulfah",     "fakir",        250_000, 4, "rental",   3_400_000, "PENDING",  "TELEGRAM"),
    ("3201010101000015", "Yusuf Ibrahim",    "riqab",              0, 2, "homeless", 1_100_000, "PENDING",  "API"),
]


def batch_insert(supabase, table: str, rows: list[dict], batch_size: int = BATCH_SIZE) -> list[dict]:
    """Insert rows in batches. Returns all inserted rows."""
    all_inserted: list[dict] = []
    total = len(rows)

    for i in range(0, total, batch_size):
        batch = rows[i : i + batch_size]
        try:
            result = supabase.table(table).insert(batch).execute()
            all_inserted.extend(result.data)
            logger.info(f"  {table}: inserted {min(i + batch_size, total)}/{total}")
        except Exception as e:
            logger.error(f"  {table}: batch {i}-{i + batch_size} failed: {e}")
            for j, row in enumerate(batch):
                try:
                    result = supabase.table(table).insert(row).execute()
                    all_inserted.extend(result.data)
                except Exception as e2:
                    logger.error(f"  {table}: row {i + j} failed: {e2}")

    return all_inserted


def seed_regions(supabase) -> dict[str, str]:
    """Seed 34 provinsi. Returns {bps_code: region_id}."""
    logger.info("=== Seeding regions (34 provinsi) ===")

    rows = [
        {
            "name": p["name"],
            "type": "provinsi",
            "code": p["bps_code"],
        }
        for p in PROVINCES
    ]

    inserted = batch_insert(supabase, "regions", rows)
    mapping = {(r.get("code") or ""): r["id"] for r in inserted}
    logger.info(f"  ✓ {len(mapping)} provinsi inserted")
    return mapping


def seed_sample_proposals(supabase) -> int:
    """Seed sample mustahik proposals."""
    logger.info("=== Seeding sample mustahik proposals ===")

    rows = []
    for nik, name, asnaf, income, deps, housing, amount, status, source in SAMPLE_PROPOSALS:
        rows.append({
            "nik": nik,
            "full_name": name,
            "asnaf_category": asnaf,
            "metrics": {
                "monthly_income": income,
                "dependents": deps,
                "housing": housing,
            },
            "allocated_amount": amount,
            "status": status,
            "source": source,
        })

    # Note: priority_score auto-computed by DB trigger trg_proposal_priority
    inserted = batch_insert(supabase, "mustahik_proposals", rows)
    logger.info(f"  ✓ {len(inserted)} sample proposals inserted")
    return len(inserted)


def reset_data(supabase) -> None:
    """Delete seeded data in correct FK order."""
    logger.info("=== Resetting seeded data ===")
    tables_order = [
        "audit_ledger",
        "program_beneficiaries",
        "disbursement_batches",
        "mustahik_proposals",
        "programs",
        "distributions",
        "collections",
        "institutions",
        "regions",
    ]
    for table in tables_order:
        try:
            supabase.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            logger.info(f"  ✓ {table} cleared")
        except Exception as e:
            logger.warning(f"  ⚠ {table}: {e}")


def main() -> int:
    parser = argparse.ArgumentParser(description="ZISWAF Hub data seeder")
    parser.add_argument("--reset", action="store_true", help="Delete seeded data before re-seeding")
    parser.add_argument(
        "--only",
        type=str,
        default="",
        help="Comma-separated list of stages to run: regions,proposals (default: all)",
    )
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — check app/.env.local")
        return 1

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    only = {s.strip() for s in args.only.split(",") if s.strip()} or None

    started = time.time()

    if args.reset:
        reset_data(supabase)

    if only is None or "regions" in only:
        seed_regions(supabase)

    if only is None or "proposals" in only:
        seed_sample_proposals(supabase)

    elapsed = time.time() - started
    logger.info(f"=== Done in {elapsed:.1f}s ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
