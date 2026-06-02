import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Append an immutable event to audit_ledger.
 * Schema: { action, entity_type, entity_id, actor_id?, payload }
 *
 * Errors are swallowed and logged — auditing must NEVER block business logic.
 */
export async function logAudit(
  supabase: SupabaseClient<Database>,
  params: {
    action: string;
    entityType: string;
    entityId?: string;
    actorId?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("audit_ledger").insert({
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    actor_id: params.actorId ?? null,
    payload: (params.payload ?? {}) as Database["public"]["Tables"]["audit_ledger"]["Insert"]["payload"],
  });

  if (error) {
    // Don't throw — audit failure shouldn't break the main flow.
    console.warn("[audit] failed to write event:", params.action, error.message);
  }
}
