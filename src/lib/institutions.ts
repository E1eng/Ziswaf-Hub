"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { AUDIT_ENTITY } from "@/lib/constants/ziswaf";

export interface UpdateInstitutionInput {
  institutionId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
}

export async function updateInstitutionProfile(
  input: UpdateInstitutionInput
): Promise<UpdateResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  // RLS akan reject kalau user bukan admin di institusi ini
  const { data: updated, error } = await supabase
    .from("institutions")
    .update({
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.email !== undefined && { email: input.email.trim() || null }),
      ...(input.phone !== undefined && { phone: input.phone.trim() || null }),
      ...(input.address !== undefined && { address: input.address.trim() || null }),
      ...(input.website !== undefined && { website: input.website.trim() || null }),
      ...(input.bankName !== undefined && { bank_name: input.bankName.trim() || null }),
      ...(input.bankAccountName !== undefined && {
        bank_account_name: input.bankAccountName.trim() || null,
      }),
      ...(input.bankAccountNumber !== undefined && {
        bank_account_number: input.bankAccountNumber.trim() || null,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.institutionId)
    .select("id, name")
    .single();

  if (error || !updated) {
    return { success: false, error: error?.message ?? "Gagal update profil lembaga" };
  }

  await logAudit(supabase, {
    action: "INSTITUTION_PROFILE_UPDATED",
    entityType: AUDIT_ENTITY.INSTITUTION,
    entityId: updated.id,
    actorId: user.id,
    institutionId: updated.id,
    payload: { updated_fields: Object.keys(input).filter((k) => k !== "institutionId") },
  });

  return { success: true };
}
