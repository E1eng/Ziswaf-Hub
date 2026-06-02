// ZISWAF Hub — Telegram Bot Worker
// =================================
// Bot tunggal platform `@ziswafhub_bot` untuk field worker.
//
// Setup:
//   cd bot
//   npm install
//   cp .env.example .env  # isi TELEGRAM_BOT_TOKEN dan API_BASE_URL
//   npm start
//
// Bot akan run dengan long-polling. Tidak perlu webhook config.
//
// Commands:
//   /start FW-XXXXXX  — activate field worker via invite code
//   /proposal         — submit assessment mustahik baru (conversation flow)
//   /status           — lihat status field worker
//   /help

import "dotenv/config";
import { Bot, session, GrammyError, HttpError } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";

if (!BOT_TOKEN) {
  console.error("[fatal] TELEGRAM_BOT_TOKEN tidak di-set di .env");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ── In-memory session per chat ───────────────────────────────
// Untuk production, ganti ke storage persistent (Redis/Supabase Storage).
bot.use(
  session({
    initial: () => ({
      flow: null, // 'proposal' saat conversation aktif
      step: null,
      data: {},
    }),
  })
);

// ── Helpers ──────────────────────────────────────────────────
const ASNAF_OPTIONS = [
  "fakir", "miskin", "amil", "mualaf",
  "riqab", "gharimin", "fisabilillah", "ibnu_sabil",
];

const ASNAF_LABELS = {
  fakir: "Fakir",
  miskin: "Miskin",
  amil: "Amil",
  mualaf: "Mualaf",
  riqab: "Riqab",
  gharimin: "Gharimin",
  fisabilillah: "Fisabilillah",
  ibnu_sabil: "Ibnu Sabil",
};

const HOUSING_OPTIONS = {
  homeless: "Tidak Punya",
  rental: "Sewa/Kontrak",
  family: "Numpang Keluarga",
  owned: "Milik Sendiri",
};

async function postJson(path, body) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: `Non-JSON response: ${text.slice(0, 200)}` };
  }
  return { status: res.status, ok: res.ok, json };
}

function fmtRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

// ── /start ───────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  const param = ctx.match?.trim();
  const chatId = ctx.chat.id;
  const username = ctx.from?.username ?? null;

  if (!param) {
    await ctx.reply(
      "👋 Selamat datang di ZISWAF Hub Bot.\n\n" +
        "Untuk aktivasi sebagai field worker, klik link undangan dari supervisor lembaga Anda.\n\n" +
        "Format: /start FW-XXXXXX"
    );
    return;
  }

  if (!/^FW-[A-F0-9]{6}$/i.test(param)) {
    await ctx.reply("⚠ Format kode tidak valid. Hubungi supervisor untuk kode baru.");
    return;
  }

  await ctx.reply("⏳ Mengaktivasi akun Anda...");

  const { ok, json } = await postJson("/api/telegram-activate", {
    invite_code: param,
    telegram_chat_id: chatId,
    telegram_username: username,
  });

  if (!ok) {
    await ctx.reply(`❌ ${json.error ?? "Aktivasi gagal"}`);
    return;
  }

  await ctx.reply(
    `✅ ${json.message}\n\n` +
      `Anda sekarang dapat submit assessment mustahik dengan command:\n` +
      `/proposal\n\n` +
      `Atau /help untuk lihat semua command.`
  );
});

// ── /help ────────────────────────────────────────────────────
bot.command("help", async (ctx) => {
  await ctx.reply(
    "🤖 ZISWAF Hub Bot — Daftar Command\n\n" +
      "/proposal — Ajukan calon mustahik baru\n" +
      "/cancel   — Batalkan input yang sedang berjalan\n" +
      "/status   — Cek status akun field worker\n" +
      "/help     — Tampilkan pesan ini"
  );
});

// ── /cancel ──────────────────────────────────────────────────
bot.command("cancel", async (ctx) => {
  ctx.session.flow = null;
  ctx.session.step = null;
  ctx.session.data = {};
  await ctx.reply("❎ Input dibatalkan.");
});

// ── /status ──────────────────────────────────────────────────
bot.command("status", async (ctx) => {
  // Bot tidak punya endpoint khusus untuk ini; tampilkan info dari sesi saja
  await ctx.reply(
    `Chat ID: ${ctx.chat.id}\n` +
      `Username: ${ctx.from?.username ? "@" + ctx.from.username : "-"}\n\n` +
      `Untuk verifikasi field worker terdaftar, coba submit /proposal — kalau ditolak,` +
      ` hubungi supervisor lembaga Anda.`
  );
});

// ── /proposal ────────────────────────────────────────────────
bot.command("proposal", async (ctx) => {
  ctx.session.flow = "proposal";
  ctx.session.step = "nik";
  ctx.session.data = {};
  await ctx.reply(
    "📝 Ajukan Mustahik Baru\n\n" +
      "Step 1/5 — Masukkan NIK 16 digit:\n" +
      "(Ketik /cancel untuk batal)"
  );
});

// ── Conversation handler ─────────────────────────────────────
bot.on("message:text", async (ctx) => {
  // Skip kalau bukan dalam flow
  if (ctx.session.flow !== "proposal") return;

  const text = ctx.message.text.trim();

  switch (ctx.session.step) {
    case "nik": {
      if (!/^\d{16}$/.test(text)) {
        await ctx.reply("⚠ NIK harus 16 digit angka. Coba lagi:");
        return;
      }
      ctx.session.data.nik = text;
      ctx.session.step = "name";
      await ctx.reply("Step 2/5 — Nama lengkap mustahik:");
      return;
    }

    case "name": {
      if (text.length < 3) {
        await ctx.reply("⚠ Nama terlalu pendek. Coba lagi:");
        return;
      }
      ctx.session.data.full_name = text;
      ctx.session.step = "asnaf";
      const list = Object.entries(ASNAF_LABELS)
        .map(([key, label], i) => `${i + 1}. ${label} (${key})`)
        .join("\n");
      await ctx.reply(
        `Step 3/5 — Kategori Asnaf, ketik salah satu kode:\n\n${list}\n\n` +
          `Contoh: ketik "fakir" atau "miskin"`
      );
      return;
    }

    case "asnaf": {
      const lc = text.toLowerCase();
      if (!ASNAF_OPTIONS.includes(lc)) {
        await ctx.reply(`⚠ Kategori tidak dikenali. Pilih dari: ${ASNAF_OPTIONS.join(", ")}`);
        return;
      }
      ctx.session.data.asnaf = lc;
      ctx.session.step = "income";
      await ctx.reply("Step 4/5 — Pendapatan bulanan (angka, contoh: 500000):");
      return;
    }

    case "income": {
      const n = Number(text.replace(/\D/g, ""));
      if (!Number.isFinite(n) || n < 0) {
        await ctx.reply("⚠ Masukkan angka valid:");
        return;
      }
      ctx.session.data.income = n;
      ctx.session.step = "deps_housing";
      await ctx.reply(
        "Step 5/5 — Jumlah tanggungan dan tempat tinggal.\n" +
          "Format: <angka> <housing>\n" +
          "Housing: homeless, rental, family, owned\n\n" +
          "Contoh: 5 rental"
      );
      return;
    }

    case "deps_housing": {
      const parts = text.split(/\s+/);
      if (parts.length < 2) {
        await ctx.reply("⚠ Format salah. Contoh: 5 rental");
        return;
      }
      const deps = Number(parts[0]);
      const housing = parts[1].toLowerCase();
      if (!Number.isFinite(deps) || deps < 0) {
        await ctx.reply("⚠ Jumlah tanggungan harus angka:");
        return;
      }
      if (!HOUSING_OPTIONS[housing]) {
        await ctx.reply(`⚠ Housing harus salah satu: ${Object.keys(HOUSING_OPTIONS).join(", ")}`);
        return;
      }
      ctx.session.data.dependents = deps;
      ctx.session.data.housing = housing;
      ctx.session.step = "confirm";

      const d = ctx.session.data;
      await ctx.reply(
        "📋 Ringkasan:\n\n" +
          `NIK: ${d.nik.slice(0, 4)}****${d.nik.slice(-4)}\n` +
          `Nama: ${d.full_name}\n` +
          `Asnaf: ${ASNAF_LABELS[d.asnaf]}\n` +
          `Pendapatan: ${fmtRupiah(d.income)}\n` +
          `Tanggungan: ${d.dependents}\n` +
          `Tempat tinggal: ${HOUSING_OPTIONS[d.housing]}\n\n` +
          `Ketik "ya" untuk submit, atau /cancel untuk batal.`
      );
      return;
    }

    case "confirm": {
      if (text.toLowerCase() !== "ya") {
        await ctx.reply('Ketik "ya" untuk konfirmasi atau /cancel untuk batal.');
        return;
      }

      const d = ctx.session.data;
      await ctx.reply("⏳ Mengirim ke server...");

      const { ok, json } = await postJson("/api/telegram-webhook", {
        telegram_chat_id: ctx.chat.id,
        nik: d.nik,
        full_name: d.full_name,
        asnaf_category: d.asnaf,
        metrics: {
          monthly_income: d.income,
          dependents: d.dependents,
          housing: d.housing,
        },
      });

      ctx.session.flow = null;
      ctx.session.step = null;
      ctx.session.data = {};

      if (!ok) {
        await ctx.reply(`❌ Gagal: ${json.error ?? "Unknown error"}`);
        return;
      }

      await ctx.reply(
        `✅ ${json.message}\n\n` +
          `Skor prioritas otomatis: ${json.assessment?.priority_score ?? "-"}\n` +
          `Status: ${json.assessment?.status ?? "PENDING"} (menunggu review supervisor)\n\n` +
          `Untuk ajukan mustahik lain: /proposal`
      );
      return;
    }
  }
});

// ── Error handling ───────────────────────────────────────────
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[bot:error] update ${ctx.update.update_id}:`, err.error);
  if (err.error instanceof GrammyError) {
    console.error("Telegram API error:", err.error.description);
  } else if (err.error instanceof HttpError) {
    console.error("HTTP error contacting Telegram:", err.error);
  }
});

// ── Start ────────────────────────────────────────────────────
console.log("🚀 ZISWAF Hub bot starting...");
console.log(`   API base: ${API_BASE}`);
bot.start({
  onStart: (botInfo) => {
    console.log(`✓ Bot online: @${botInfo.username}`);
  },
});
