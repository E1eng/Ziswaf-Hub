# ADR 0002 — Coordination Layer Architecture

**Status:** Diterima
**Tanggal:** Juni 2026
**Konteks:** Pasca-brainstorming arsitektur (lihat brief `INSTRUCTION.md` di workspace root)

## Konteks

ADR 0001 menetapkan pivot dari "kecamatan-level smart allocation" ke "individual NIK targeting + greedy knapsack" — schema sederhana dengan satu tabel `mustahik_proposals` untuk semua hal.

Setelah brainstorming arsitektur lebih dalam, kita identifikasi gap-gap berikut yang membuat skema ADR 0001 tidak cukup untuk kasus produksi yang realistis:

1. **Tidak ada konsep "program"** — wizard alokasi pakai pool global, melanggar fiqih (zakat tidak boleh dialokasikan ke selain 8 asnaf, dst).
2. **Tidak ada coordination antar lembaga** — sama mustahik bisa terima bantuan duplikat dari beberapa lembaga tanpa terdeteksi (justru ini pain point utama ekosistem).
3. **Tidak ada donor-side flow** — muzakki dapat kode lacak dari mana? Tidak terdefinisi.
4. **Field worker auth tidak terkunci** — webhook Telegram bisa dikirim siapa saja, tidak terikat lembaga.
5. **Audit log skema event-only** — tidak punya source-of-truth untuk dedup historis (`assistance_log`).

## Keputusan

Restructure menjadi **3-layer architecture** dengan domain model baru:

```
┌─────────────────────────────────────────┐
│ Layer 3 — Public Transparency           │
│   /lacak, /lembaga, /program (publik)   │
├─────────────────────────────────────────┤
│ Layer 2 — Coordination & Decision       │
│   Smart allocation (per-program)        │
│   Cross-institution dedup                │
│   Audit ledger                           │
├─────────────────────────────────────────┤
│ Layer 1 — Data Input                    │
│   Telegram bot @ziswafhub_bot            │
│   Web dashboard (admin, supervisor)     │
│   Bulk CSV import                        │
└─────────────────────────────────────────┘
```

### 10 Keputusan Lock

| # | Topik | Keputusan |
|---|---|---|
| 1 | Peran platform terhadap dana | Skenario C: lembaga handle uang, platform = receipt + coordination |
| 2 | Algoritma alokasi | Per-program + multi-fund + fiqih-aware (knapsack greedy dalam batas asnaf yang sah) |
| 3 | Otentikasi tracking | Anonymous — siapa pun yang punya kode bisa lacak |
| 4 | Privacy antar lembaga | Full transparency — semua lembaga lihat semua data mustahik & log bantuan |
| 5 | Field worker auth | Hybrid — Telegram bot platform tunggal + web dashboard untuk supervisor |
| 6 | Donor input flow | Lembaga input donasi via dashboard → platform auto-email kode ke muzakki |
| 7 | Donation→batch mapping | Donation pool model — donor lacak kode → lihat status pool lembaga, bukan batch spesifik |
| 8 | Mustahik registry | Shared registry. Setiap lembaga buat **assessment** sendiri (skor & status review berbeda per lembaga) |
| 9 | Telegram bot | Satu bot platform `@ziswafhub_bot`. Field worker register via `/start <invite_code>` |
| 10 | Lifecycle mustahik | Status: `active / graduated / deceased / moved / flagged_invalid`. Bisa di-update oleh lembaga manapun |

### Domain model baru

Pivot dari skema ADR 0001:

| Entitas ADR 0001 | Entitas ADR 0002 | Perubahan |
|---|---|---|
| `mustahik_proposals` (single tabel) | `mustahik_registry` + `mustahik_assessments` | Identity (NIK) terpisah dari assessment. Multi-lembaga bisa assess mustahik yang sama dengan skor berbeda. |
| `programs` (versi simple, status DRAFT/ACTIVE/COMPLETED) | `programs` (revisi: + `fund_type`, `assistance_type`, `period_start/end`, fiqih constraint) | Program jadi entry point alokasi cerdas. Multi-fund + fiqih-aware. |
| `program_beneficiaries` | `allocations` (sebagai output wizard) + `assistance_log` (sebagai source-of-truth dedup) | Pisahkan "rencana" dari "fakta historis". Allocation bisa di-cancel sebelum disburse; assistance_log append-only setelah disburse. |
| `disbursement_batches` | `disbursement_batches` (mostly unchanged) | + FK ke `program_id` (sudah ada). Trigger DB tulis `assistance_log` saat status berubah ke `DISBURSED`. |
| (tidak ada) | `donations` | Catat donasi masuk per lembaga, generate kode lacak, auto-email ke muzakki. Pool model. |
| (tidak ada) | `institution_users` | Mapping `auth.users` ke `institutions` + role (admin/supervisor/reviewer). |
| (tidak ada) | `field_workers` | Identity field worker berbasis `telegram_chat_id` + invite code dari supervisor. |
| `audit_ledger` (event-log style) | `audit_ledger` (unchanged) | Tetap INSERT-only, immutable. |

### Constraint fiqih

Built-in di DB CHECK constraint untuk `programs.target_asnaf` berdasarkan `programs.fund_type`:

| `fund_type` | Asnaf yang valid |
|---|---|
| `zakat` | fakir, miskin, amil, mualaf, riqab, gharimin, fisabilillah, ibnu_sabil |
| `infaq`, `sedekah` | semua (bebas) |
| `wakaf` | tidak via knapsack — wakaf permanent, di-handle modul terpisah (post-hackathon) |
| `dskl` | sesuai jenis (fidyah → fakir/miskin; kafarat → kasus khusus; qurban → fakir/miskin) |

UI dropdown `target_asnaf` di form program juga di-filter berdasarkan `fund_type` yang dipilih, supaya pelanggaran fiqih tidak mungkin terjadi sejak input.

### Dedup logic

Saat wizard alokasi fetch kandidat dari `mustahik_assessments`:

```sql
-- Untuk tiap kandidat, cek overlap di assistance_log
SELECT al.mustahik_id, i.name AS source_institution, al.assistance_type,
       al.period_start, al.period_end, b.batch_code
FROM assistance_log al
JOIN institutions i ON i.id = al.institution_id
JOIN disbursement_batches b ON b.id = al.batch_id
WHERE al.mustahik_id = ANY(<candidate_ids>)
  AND al.assistance_type = <program.assistance_type>
  AND tstzrange(al.period_start, al.period_end, '[]') &&
      tstzrange(<program.period_start>, <program.period_end>, '[]')
```

Hasil ditampilkan sebagai warning row-level di UI alokasi. Admin bisa override per-row, audit logged sebagai `ALLOCATION_OVERRIDE_DUPLICATE` dengan reason text.

## Konsekuensi

### Positif

- **Compliance fiqih built-in** — tidak mungkin alokasikan zakat ke selain 8 asnaf
- **Anti-duplikasi cross-institution** — solving real coordination problem ekosistem ZISWAF
- **Donor experience** — kode lacak dengan auto-email, pool model jujur (tidak bohong-bohong virtual mapping)
- **Field worker flow lengkap** — onboarding via invite code, conversation flow di Telegram, foto upload, konfirmasi penerimaan
- **Per-lembaga assessment** — sama mustahik bisa skor beda dari lembaga A vs B, lebih realistis
- **Audit trail end-to-end** — assistance_log + audit_ledger menjawab "siapa kasih apa ke siapa kapan"

### Trade-off

- **Schema lebih kompleks** — 5+ tabel baru. Migration plan harus hati-hati untuk backfill 15 sample proposals dari ADR 0001 ke schema baru.
- **Privacy implications** — full transparency antar lembaga berarti siapa salurkan ke siapa terlihat. Mitigasi: NIK masking di UI publik, RLS deny anon untuk PII.
- **Telegram bot worker** — perlu hosting tambahan (Railway/Fly.io) atau Vercel Edge. Cost ~$5/bulan tier kecil.
- **Email infra** — perlu Resend account atau Supabase Email. Free tier mencukupi untuk hackathon.
- **Onboarding lembaga lebih panjang** — perlu invite admin → setup field worker → buat program dulu sebelum bisa alokasi. Lebih realistis tapi demo flow lebih kompleks.

### Yang dipertahankan dari ADR 0001

- NIK 16-digit sebagai identifier primer
- 8 asnaf classification
- Audit ledger event-log style
- RPC `calculate_priority_score` + trigger auto-skoring
- Disbursement batch status `PROCESSING → VERIFIED → DISBURSED → RECEIVED`
- Public tracking via batch code (sekarang ditambah donation code)

### Yang di-deprecate dari ADR 0001

- Single-table `mustahik_proposals` → split jadi registry + assessments
- Pool global di wizard alokasi → wajib dalam konteks program
- `program_beneficiaries` (untuk bulk paste) → bisa tetap ada sebagai shortcut, tapi flow utama lewat assessments

## Implementation Roadmap

Lihat section "Roadmap Implementasi" di `INSTRUCTION.md` (workspace root) — Phase 0 sampai Phase 5.

## Referensi

- Brief produk: `INSTRUCTION.md` (workspace root)
- Schema canonical: [`docs/database-schema.sql`](../database-schema.sql) *(akan di-revisi di Phase 0)*
- ERD: [`docs/erd-diagram.md`](../erd-diagram.md) *(revisi sesuai ADR ini)*
- ADR sebelumnya: [`0001-pivot-to-individual-nik-targeting.md`](./0001-pivot-to-individual-nik-targeting.md)
