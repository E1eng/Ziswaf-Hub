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
