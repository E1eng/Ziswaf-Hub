import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Append an immutable event to audit_ledger.
 *
 * Schema audit_ledger v2:
 *   action, entity_type, entity_id, actor_id, institution_id, payload
 *
 * Errors di-swallow + di-log — auditing tidak boleh block business logic.
 */
export async function logAudit(
  supabase: SupabaseClient<Database>,
  params: {
    action: string;
    entityType: string;
    entityId?: string;
    actorId?: string;
    institutionId?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("audit_ledger").insert({
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    actor_id: params.actorId ?? null,
    institution_id: params.institutionId ?? null,
    payload: (params.payload ?? {}) as Database["public"]["Tables"]["audit_ledger"]["Insert"]["payload"],
  });

  if (error) {
    console.warn("[audit] failed to write event:", params.action, error.message);
  }
}
