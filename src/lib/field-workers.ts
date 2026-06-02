"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, AUDIT_ENTITY } from "@/lib/constants/ziswaf";

export interface InviteFieldWorkerInput {
  institutionId: string;
  fullName: string;
  phone?: string;
  expiresInDays?: number; // default 7
}

export interface InviteFieldWorkerResult {
  success: boolean;
  fieldWorkerId?: string;
  inviteCode?: string;
  inviteUrl?: string;
  expiresAt?: string;
  error?: string;
}

const DEFAULT_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "ziswafhub_bot";

export async function inviteFieldWorker(
  input: InviteFieldWorkerInput
): Promise<InviteFieldWorkerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  if (!input.fullName.trim()) {
    return { success: false, error: "Nama wajib diisi" };
  }

  // Generate invite code via DB RPC
  const { data: codeData, error: codeErr } = await supabase.rpc("generate_invite_code");
  if (codeErr || !codeData) {
    return { success: false, error: codeErr?.message ?? "Gagal generate invite code" };
  }
  const inviteCode = codeData as string;

  const expiresInDays = input.expiresInDays ?? 7;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const { data: fw, error } = await supabase
    .from("field_workers")
    .insert({
      institution_id: input.institutionId,
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      invite_code: inviteCode,
      invite_expires_at: expiresAt.toISOString(),
      invited_by: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !fw) {
    return { success: false, error: error?.message ?? "Gagal membuat invite" };
  }

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.FIELD_WORKER_INVITED,
    entityType: AUDIT_ENTITY.FIELD_WORKER,
    entityId: fw.id,
    actorId: user.id,
    institutionId: input.institutionId,
    payload: {
      full_name: input.fullName,
      invite_code: inviteCode,
      expires_at: expiresAt.toISOString(),
    },
  });

  const inviteUrl = `https://t.me/${DEFAULT_BOT_USERNAME}?start=${inviteCode}`;

  return {
    success: true,
    fieldWorkerId: fw.id,
    inviteCode,
    inviteUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function revokeFieldWorker(
  fieldWorkerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  const { data: fw, error } = await supabase
    .from("field_workers")
    .update({ status: "revoked" })
    .eq("id", fieldWorkerId)
    .select("institution_id, full_name")
    .single();

  if (error || !fw) {
    return { success: false, error: error?.message ?? "Gagal revoke field worker" };
  }

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.FIELD_WORKER_REVOKED,
    entityType: AUDIT_ENTITY.FIELD_WORKER,
    entityId: fieldWorkerId,
    actorId: user.id,
    institutionId: fw.institution_id,
    payload: { full_name: fw.full_name },
  });

  return { success: true };
}

export async function regenerateInviteCode(
  fieldWorkerId: string
): Promise<InviteFieldWorkerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  // Generate new code
  const { data: codeData, error: codeErr } = await supabase.rpc("generate_invite_code");
  if (codeErr || !codeData) {
    return { success: false, error: codeErr?.message ?? "Gagal generate invite code" };
  }
  const inviteCode = codeData as string;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data: fw, error } = await supabase
    .from("field_workers")
    .update({
      invite_code: inviteCode,
      invite_expires_at: expiresAt.toISOString(),
      status: "pending",
    })
    .eq("id", fieldWorkerId)
    .select("id, institution_id")
    .single();

  if (error || !fw) {
    return { success: false, error: error?.message ?? "Gagal regenerate invite" };
  }

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.FIELD_WORKER_INVITED,
    entityType: AUDIT_ENTITY.FIELD_WORKER,
    entityId: fw.id,
    actorId: user.id,
    institutionId: fw.institution_id,
    payload: { regenerated: true, invite_code: inviteCode },
  });

  return {
    success: true,
    fieldWorkerId: fw.id,
    inviteCode,
    inviteUrl: `https://t.me/${DEFAULT_BOT_USERNAME}?start=${inviteCode}`,
    expiresAt: expiresAt.toISOString(),
  };
}
