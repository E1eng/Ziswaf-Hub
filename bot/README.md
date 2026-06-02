# ZISWAF Hub — Telegram Bot Worker

Bot tunggal platform untuk field worker submit assessment mustahik dari lapangan.

## Setup

```bash
cd bot
npm install
cp .env.example .env
# Edit .env, isi TELEGRAM_BOT_TOKEN
npm start
```

## Mendapatkan Bot Token

1. Buka Telegram, chat `@BotFather`
2. Kirim `/newbot`
3. Ikuti instruksi (nama bot, username harus berakhir dengan `_bot`)
4. Salin token dari `@BotFather` ke `.env`

Untuk hackathon demo, nama bot direkomendasi: `ziswafhub_bot`. Update juga env var
`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=ziswafhub_bot` di Next.js app supaya invite link match.

## Commands

| Command | Fungsi |
|---|---|
| `/start FW-XXXXXX` | Activate sebagai field worker via invite code dari supervisor |
| `/proposal` | Submit assessment mustahik baru (conversation flow 5 step) |
| `/cancel` | Batalkan input yang sedang berjalan |
| `/status` | Cek info chat dan instruksi |
| `/help` | Daftar command |

## Conversation Flow `/proposal`

```
User: /proposal
Bot: Step 1/5 — Masukkan NIK 16 digit:
User: 1101000000099001
Bot: Step 2/5 — Nama lengkap:
User: Pak Ahmad
Bot: Step 3/5 — Asnaf (fakir/miskin/...)
User: fakir
Bot: Step 4/5 — Pendapatan bulanan:
User: 200000
Bot: Step 5/5 — Tanggungan + housing
User: 5 homeless
Bot: 📋 Ringkasan: ... Ketik "ya" untuk submit
User: ya
Bot: ✅ Skor prioritas: 95, Status: PENDING
```

## Arsitektur

```
[Telegram User]
       │
       ▼
[Bot worker (this folder)]  ◄── long-polling Telegram
       │
       │ POST JSON
       ▼
[Next.js API: /api/telegram-activate]   ── bind chat_id ke field_workers
[Next.js API: /api/telegram-webhook]    ── insert mustahik_assessments
       │
       ▼
[Supabase Postgres + RLS]
```

Bot ini stateless — session di-store in-memory per chat. Restart bot = hilang
session konversasi yang sedang berlangsung. Untuk production, ganti session
storage ke Redis atau Supabase Storage.

## Deployment

Bot hanya butuh outbound HTTPS ke Telegram + ke Next.js app. Tidak butuh inbound port.

**Option 1 — Railway / Fly.io / Render:**
- Push folder `bot/` ke repo terpisah atau set monorepo path
- Set env vars `TELEGRAM_BOT_TOKEN` & `API_BASE_URL`
- `npm start` sebagai start command
- Free tier ($5/bulan) cukup untuk hackathon scale

**Option 2 — VPS / Server pribadi:**
```bash
# Pakai PM2 atau systemd
pm2 start index.js --name ziswafhub-bot
pm2 save
pm2 startup
```

**Option 3 — Local development:**
- Run bot lokal di laptop sambil `npm run dev` Next.js
- `API_BASE_URL=http://localhost:3000`
- Bot menggunakan polling, jadi tidak perlu publik IP

## Limits & Roadmap

- Konversasi `/verify <NIK>` (kunjungan rumah) — TODO
- Konversasi `/confirm <batch_code>` (penerimaan bantuan) — TODO
- Foto upload ke Supabase Storage — TODO
- Rate limiting per chat_id — TODO
- Multi-language (English, Bahasa Indonesia) — currently Bahasa Indonesia only
