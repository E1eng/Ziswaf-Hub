"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, AUDIT_ENTITY, type LifecycleStatus } from "@/lib/constants/ziswaf";

export interface UpdateLifecycleInput {
  mustahikId: string;
  status: LifecycleStatus;
  reason?: string;
}

export async function updateMustahikLifecycle(
  input: UpdateLifecycleInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  const { data, error } = await supabase
    .from("mustahik_registry")
    .update({
      lifecycle_status: input.status,
      lifecycle_changed_at: new Date().toISOString(),
      lifecycle_changed_by: user.id,
      lifecycle_reason: input.reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.mustahikId)
    .select("id, full_name, nik")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Gagal update status" };
  }

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.MUSTAHIK_LIFECYCLE_CHANGED,
    entityType: AUDIT_ENTITY.MUSTAHIK,
    entityId: data.id,
    actorId: user.id,
    payload: {
      new_status: input.status,
      reason: input.reason ?? null,
      nik_masked: data.nik.slice(0, 4) + "****" + data.nik.slice(-4),
    },
  });

  return { success: true };
}
