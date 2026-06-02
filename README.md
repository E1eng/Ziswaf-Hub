# ZISWAF Hub

Decision support system untuk ekosistem Zakat, Infaq, Sedekah, dan Wakaf (ZISWAF) Indonesia.

Platform memilih mustahik secara individual (per NIK) dengan skor prioritas otomatis, lalu menjalankan greedy knapsack untuk alokasi optimal sesuai anggaran lembaga. Setiap penyaluran tercatat di audit ledger immutable dan dapat dilacak publik per batch (anonim, sesuai UU PDP).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | TailwindCSS 4 + shadcn/ui |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL, Auth, RLS, Realtime) |
| Data Seed | Python (supabase-py) |
| Notifications | sonner |

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing publik
│   │   ├── lacak/                    # Lacak penyaluran per batch (publik)
│   │   ├── login/, register/, demo/  # Auth + demo mode juri
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Beranda KPI
│   │   │   ├── proposal/             # E-Proposal mustahik (NIK-based)
│   │   │   ├── program/              # Program penyaluran (rutin/proposal/insidentil)
│   │   │   ├── alokasi/              # Alokasi Cerdas — greedy knapsack
│   │   │   ├── penyaluran/           # Kelola batch (PROCESSING → RECEIVED)
│   │   │   └── pengaturan/           # Profil lembaga & info platform
│   │   └── api/
│   │       └── telegram-webhook/     # Submission proposal dari bot lapangan
│   ├── components/{ui, app-sidebar, page-header}
│   ├── hooks/use-mobile
│   └── lib/
│       ├── supabase/{client,server,middleware,database.types}
│       ├── constants/ziswaf.ts       # Asnaf, status, sektor, audit constants
│       ├── utils/{format,privacy}    # NIK masking, Rupiah, persentase
│       └── audit.ts                  # Helper logAudit
├── data/
│   ├── seed/                         # Python seeder (regions + sample proposals)
│   │   ├── main.py
│   │   ├── config.py
│   │   └── sources/regions.py
│   └── requirements.txt
├── docs/
│   ├── database-schema.sql           # Canonical DDL — sumber kebenaran
│   ├── erd-diagram.md                # Entity-Relationship Diagram
│   ├── research-notes.md             # Riset domain ZISWAF
│   └── adr/0001-pivot-to-individual-nik-targeting.md
├── INSTRUCTION.md                    # Project brief & development guide
└── README.md
```

## Database

**12 tabel** di Supabase (PostgreSQL). Sumber kebenaran: [`docs/database-schema.sql`](docs/database-schema.sql).

| Kategori | Tabel | Fungsi |
|---|---|---|
| Reference | `regions`, `institution_types`, `institutions`, `ziswaf_categories`, `distribution_sectors` | Master data |
| Core | `mustahik_proposals` | Pengajuan per NIK (anti-duplikat lewat unique partial index) |
| Core | `programs`, `program_beneficiaries` | Program institusional + bulk paste daftar penerima |
| Core | `disbursement_batches` | Batch penyaluran anonim (Shopee-style status timeline) |
| Legacy | `collections`, `distributions` | Disimpan untuk laporan lembaga (tidak in core flow) |
| Audit | `audit_ledger` | INSERT-only event log (immutable) |

ERD lengkap di [`docs/erd-diagram.md`](docs/erd-diagram.md).

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+ (untuk seeder)
- Supabase project ([supabase.com](https://supabase.com))

### 1. Setup Frontend

```bash
npm install
cp .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY
```

### 2. Apply Database Schema

Buka Supabase Dashboard → SQL Editor → paste isi [`docs/database-schema.sql`](docs/database-schema.sql) → Run.

Skema bersifat idempotent — aman dijalankan ulang.

### 3. Seed Data

```bash
cd data
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m seed.main
```

Akan diisi: 34 provinsi + 15 sample mustahik proposals dengan skor prioritas otomatis dari trigger DB.

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Features

### Publik (tanpa login)
- **Landing page** — statistik aktivitas platform + entry ke lacak penyaluran
- **Lacak Penyaluran** (`/lacak`) — input kode batch, tampilkan timeline status (PROCESSING → VERIFIED → DISBURSED → RECEIVED). Anonim, tidak menampilkan NIK/nama.

### Demo Mode
- **`/demo`** — Auto-login akun demo untuk juri hackathon. Klik "Coba Demo" di landing.

### Dashboard (authenticated)
- **Beranda** — KPI proposal (total, pending, approved, disbursed) + total dana tersalurkan + quick actions
- **E-Proposal** (`/dashboard/proposal`) — kelola pengajuan mustahik per NIK, approve/reject, bulk approve, realtime via Supabase Realtime
- **Program** (`/dashboard/program`) — buat program rutin / proposal-driven / insidentil dengan target asnaf
- **Detail Program** (`/dashboard/program/[id]`) — single add + bulk paste penerima → validasi duplikat lintas-program & lintas-jalur → buat batch
- **Alokasi Cerdas** (`/dashboard/alokasi`) — wizard 3 step: input anggaran → greedy knapsack → batch creation + audit log + export CSV
- **Kelola Penyaluran** (`/dashboard/penyaluran`) — admin progress status batch tahap demi tahap
- **Pengaturan** — profil lembaga + sumber data domain + kepatuhan regulasi

### Smart Allocation Engine (greedy knapsack)
Fitur utama:
1. Input total anggaran (Rupiah)
2. Sistem ambil semua proposal `APPROVED` urutkan by `priority_score` DESC
3. Greedy: pilih individu satu per satu selama `total_allocated + amount ≤ budget`
4. Output: tabel penerima terpilih + efisiensi alokasi + rata-rata per penerima
5. Approve & Disburse → buat `disbursement_batches` (status `PROCESSING`) + tandai proposals `DISBURSED` + insert `audit_ledger` event
6. Export CSV daftar penerima

### Anti-Duplikasi
- `mustahik_proposals` punya unique partial index pada NIK untuk status `≠ REJECTED, DISBURSED`
- Validasi `program_beneficiaries` menggabung 3 cek:
  - Cross-program: NIK sudah ada di program lain dengan status `VALIDATED` / `DISBURSED`
  - Cross-channel: NIK sudah `DISBURSED` di `mustahik_proposals`
  - Intra-program: NIK muncul lebih dari sekali dalam program yang sama

### Privacy & Audit
- NIK selalu di-mask di UI (`3201********0001`) lewat `lib/utils/privacy.maskNik`
- `audit_ledger` INSERT-only (UPDATE/DELETE diblokir lewat RLS)
- Tracking publik anonim — tidak menampilkan PII

## Skoring Prioritas

Dihitung otomatis oleh RPC `calculate_priority_score` di trigger `trg_proposal_priority`. Total maksimum 100.

| Komponen | Bobot | Logika |
|---|---|---|
| Pendapatan bulanan | 0–40 | Lebih rendah = skor lebih tinggi (clamp di Rp2 jt) |
| Jumlah tanggungan | 0–25 | 5 poin per tanggungan, cap di 25 |
| Kategori asnaf | 0–20 | fakir=20, miskin=18, gharimin=15, ibnu_sabil=12, mualaf=10, fisabilillah=8, riqab=8, amil=5 |
| Kondisi tempat tinggal | 0–15 | homeless=15, rental=10, family=6, owned=2 |

## Sumber Data Domain

| Sumber | Untuk |
|---|---|
| BPS | Garis kemiskinan, IPM (referensi threshold pendapatan mustahik) |
| BAZNAS / Puskas BAZNAS | Standar 8 asnaf, biaya per program |
| Kemendagri | Daftar wilayah resmi (provinsi/kab/kec) |

## Catatan

Data sample yang diseed berupa 15 proposal sintetis (`3201010101...`) dengan distribusi asnaf realistis untuk demo. Untuk produksi, integrasikan dengan sumber data lembaga (DTKS Kemensos, SIMBA BAZNAS, dll).

## Roadmap

Fitur yang dipertimbangkan pasca-hackathon:
- Integrasi payment gateway (Midtrans, Xendit, Flip) untuk auto-disburse
- Treasury balance per lembaga (dana zakat / infaq / wakaf terpisah)
- Real-time integration ke SIMBA BAZNAS & DTKS Kemensos untuk cross-check NIK
- Mobile app petugas lapangan untuk konfirmasi penerimaan

## License

MIT
