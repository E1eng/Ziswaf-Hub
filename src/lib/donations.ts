"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, AUDIT_ENTITY, type FundType, type DonationChannel } from "@/lib/constants/ziswaf";
import { sendDonationEmail } from "@/lib/email";

export interface RecordDonationInput {
  institutionId: string;
  amount: number;
  fundType: FundType;
  channel?: DonationChannel | null;
  donorName?: string | null;
  donorEmail?: string | null;
  donorPhone?: string | null;
  isAnonymous?: boolean;
  notes?: string | null;
}

export interface RecordDonationResult {
  success: boolean;
  donationCode?: string;
  donationId?: string;
  emailSent?: boolean;
  error?: string;
}

/**
 * Record donasi masuk via dashboard lembaga + auto-email kode lacak.
 *
 * Flow:
 *   1. Validate user is member of institution
 *   2. Generate donation_code via DB RPC `generate_donation_code()`
 *   3. Insert ke `donations`
 *   4. Kirim email kalau donor_email diisi (best-effort, error tidak block)
 *   5. Tulis audit_ledger
 */
export async function recordDonation(input: RecordDonationInput): Promise<RecordDonationResult> {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Tidak terotentikasi" };
  }

  // Validate amount
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { success: false, error: "Jumlah donasi harus lebih dari 0" };
  }

  // Generate unique donation code via DB function (atomic, no race)
  const { data: codeData, error: codeErr } = await supabase
    .rpc("generate_donation_code");

  if (codeErr || !codeData) {
    return { success: false, error: codeErr?.message ?? "Gagal generate kode donasi" };
  }
  const donationCode = codeData as string;

  // Insert donation
  const insertPayload: Database["public"]["Tables"]["donations"]["Insert"] = {
    donation_code: donationCode,
    institution_id: input.institutionId,
    amount: input.amount,
    fund_type: input.fundType,
    channel: input.channel ?? null,
    donor_name: input.isAnonymous ? null : input.donorName ?? null,
    donor_email: input.isAnonymous ? null : input.donorEmail ?? null,
    donor_phone: input.isAnonymous ? null : input.donorPhone ?? null,
    is_anonymous: input.isAnonymous ?? false,
    notes: input.notes ?? null,
    recorded_by: user.id,
  };

  const { data: donation, error: insertErr } = await supabase
    .from("donations")
    .insert(insertPayload)
    .select("id, donation_code, donor_email, institution_id, fund_type, amount")
    .single();

  if (insertErr || !donation) {
    return { success: false, error: insertErr?.message ?? "Gagal menyimpan donasi" };
  }

  // Audit
  await logAudit(supabase, {
    action: AUDIT_ACTIONS.DONATION_RECORDED,
    entityType: AUDIT_ENTITY.DONATION,
    entityId: donation.id,
    actorId: user.id,
    payload: {
      donation_code: donation.donation_code,
      institution_id: donation.institution_id,
      fund_type: donation.fund_type,
      amount: donation.amount,
    },
  });

  // Send email if donor_email provided & not anonymous
  let emailSent = false;
  if (donation.donor_email) {
    // Lookup institution name for email body
    const { data: inst } = await supabase
      .from("institutions")
      .select("name")
      .eq("id", input.institutionId)
      .single();

    const result = await sendDonationEmail({
      to: donation.donor_email,
      donorName: input.donorName ?? "Bapak/Ibu",
      donationCode: donation.donation_code,
      amount: donation.amount,
      fundType: donation.fund_type,
      institutionName: inst?.name ?? "Lembaga ZISWAF",
    });

    if (result.success) {
      await supabase
        .from("donations")
        .update({ email_sent_at: new Date().toISOString(), email_error: null })
        .eq("id", donation.id);
      emailSent = true;
      await logAudit(supabase, {
        action: AUDIT_ACTIONS.DONATION_EMAIL_SENT,
        entityType: AUDIT_ENTITY.DONATION,
        entityId: donation.id,
        actorId: user.id,
        payload: { to: donation.donor_email },
      });
    } else {
      await supabase
        .from("donations")
        .update({ email_error: result.error ?? "Gagal kirim email" })
        .eq("id", donation.id);
    }
  }

  return {
    success: true,
    donationCode: donation.donation_code,
    donationId: donation.id,
    emailSent,
  };
}

/**
 * Resend email kode donasi (untuk donor yang lupa atau email gagal terkirim awal).
 */
export async function resendDonationEmail(donationId: string): Promise<RecordDonationResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Tidak terotentikasi" };
  }

  const { data: donation, error } = await supabase
    .from("donations")
    .select("id, donation_code, donor_email, donor_name, amount, fund_type, institution_id")
    .eq("id", donationId)
    .single();

  if (error || !donation) {
    return { success: false, error: "Donasi tidak ditemukan" };
  }
  if (!donation.donor_email) {
    return { success: false, error: "Donasi tidak memiliki email donor" };
  }

  const { data: inst } = await supabase
    .from("institutions")
    .select("name")
    .eq("id", donation.institution_id)
    .single();

  const result = await sendDonationEmail({
    to: donation.donor_email,
    donorName: donation.donor_name ?? "Bapak/Ibu",
    donationCode: donation.donation_code,
    amount: donation.amount,
    fundType: donation.fund_type,
    institutionName: inst?.name ?? "Lembaga ZISWAF",
  });

  if (result.success) {
    await supabase
      .from("donations")
      .update({ email_sent_at: new Date().toISOString(), email_error: null })
      .eq("id", donation.id);
    return { success: true, donationCode: donation.donation_code, emailSent: true };
  } else {
    await supabase
      .from("donations")
      .update({ email_error: result.error ?? "Gagal kirim email" })
      .eq("id", donation.id);
    return { success: false, error: result.error };
  }
}

// ─── BULK IMPORT (CSV) ──────────────────────────────────────────

import { FUND_TYPES, DONATION_CHANNELS } from "@/lib/constants/ziswaf";

/** Satu baris donasi mentah dari CSV (sudah di-parse jadi objek). */
export interface BulkDonationRow {
  amount: number | string;
  fund_type: string;
  channel?: string | null;
  donor_name?: string | null;
  donor_email?: string | null;
  donor_phone?: string | null;
  is_anonymous?: boolean | string | null;
  notes?: string | null;
}

export interface BulkRowError {
  row: number; // 1-based, sesuai baris data (tidak termasuk header)
  message: string;
}

export interface BulkImportResult {
  success: boolean;
  inserted: number;
  failed: number;
  errors: BulkRowError[];
  codes: string[];
  error?: string;
}

const FUND_SET = new Set<string>(FUND_TYPES);
const CHANNEL_SET = new Set<string>(DONATION_CHANNELS);

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "ya" || s === "1" || s === "y";
  }
  return false;
}

/**
 * Import banyak donasi sekaligus dari data CSV yang sudah di-parse.
 *
 * Setiap baris divalidasi independen: baris yang gagal dikumpulkan di `errors`,
 * baris yang valid tetap di-insert. Ini "partial success" — lebih ramah untuk
 * upload data lapangan yang sering ada sedikit baris kotor.
 *
 * Email TIDAK dikirim otomatis pada mode bulk (menghindari flood & rate limit).
 * Kode lacak tetap di-generate dan bisa di-resend manual dari tabel donasi.
 */
export async function recordDonationsBulk(
  institutionId: string,
  rows: BulkDonationRow[]
): Promise<BulkImportResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, inserted: 0, failed: 0, errors: [], codes: [], error: "Tidak terotentikasi" };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: false, inserted: 0, failed: 0, errors: [], codes: [], error: "Tidak ada baris data" };
  }
  if (rows.length > 1000) {
    return {
      success: false, inserted: 0, failed: 0, errors: [], codes: [],
      error: "Maksimum 1000 baris per upload. Bagi menjadi beberapa file.",
    };
  }

  // Verify membership sekali di awal
  const { data: membership } = await supabase
    .from("institution_users")
    .select("institution_id")
    .eq("user_id", user.id)
    .eq("institution_id", institutionId)
    .maybeSingle();

  if (!membership) {
    return { success: false, inserted: 0, failed: 0, errors: [], codes: [], error: "Anda bukan anggota lembaga ini" };
  }

  const errors: BulkRowError[] = [];
  const validPayloads: Database["public"]["Tables"]["donations"]["Insert"][] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNo = i + 1;
    const r = rows[i];

    const amount = Number(r.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push({ row: rowNo, message: `Jumlah tidak valid: "${r.amount}"` });
      continue;
    }

    const fund = String(r.fund_type ?? "").trim().toLowerCase();
    if (!FUND_SET.has(fund)) {
      errors.push({ row: rowNo, message: `Jenis dana tidak valid: "${r.fund_type}" (harus salah satu: ${FUND_TYPES.join(", ")})` });
      continue;
    }

    let channel: string | null = String(r.channel ?? "").trim().toLowerCase() || null;
    if (channel && !CHANNEL_SET.has(channel)) {
      errors.push({ row: rowNo, message: `Channel tidak valid: "${r.channel}" (harus salah satu: ${DONATION_CHANNELS.join(", ")})` });
      continue;
    }

    const email = String(r.donor_email ?? "").trim() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: rowNo, message: `Format email tidak valid: "${email}"` });
      continue;
    }

    const anon = parseBool(r.is_anonymous);

    // Generate kode unik per baris (RPC atomic)
    const { data: codeData, error: codeErr } = await supabase.rpc("generate_donation_code");
    if (codeErr || !codeData) {
      errors.push({ row: rowNo, message: `Gagal generate kode: ${codeErr?.message ?? "unknown"}` });
      continue;
    }

    validPayloads.push({
      donation_code: codeData as string,
      institution_id: institutionId,
      amount,
      fund_type: fund,
      channel,
      donor_name: anon ? null : (String(r.donor_name ?? "").trim() || null),
      donor_email: anon ? null : email,
      donor_phone: anon ? null : (String(r.donor_phone ?? "").trim() || null),
      is_anonymous: anon,
      notes: String(r.notes ?? "").trim() || null,
      recorded_by: user.id,
    });
  }

  if (validPayloads.length === 0) {
    return { success: false, inserted: 0, failed: errors.length, errors, codes: [], error: "Semua baris gagal divalidasi" };
  }

  const { data: inserted, error: insErr } = await supabase
    .from("donations")
    .insert(validPayloads)
    .select("id, donation_code");

  if (insErr) {
    return { success: false, inserted: 0, failed: rows.length, errors, codes: [], error: `Gagal menyimpan batch: ${insErr.message}` };
  }

  const codes = (inserted ?? []).map((d) => d.donation_code);

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.DONATION_RECORDED,
    entityType: AUDIT_ENTITY.DONATION,
    entityId: institutionId,
    actorId: user.id,
    payload: {
      bulk_import: true,
      inserted: codes.length,
      failed: errors.length,
      institution_id: institutionId,
    },
  });

  return {
    success: true,
    inserted: codes.length,
    failed: errors.length,
    errors,
    codes,
  };
}
