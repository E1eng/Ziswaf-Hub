"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export interface InstitutionContext {
  institutionId: string;
  institutionName: string;
  role: "admin" | "supervisor" | "reviewer";
  userId: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Service role client — bypasses RLS.
 * Hanya dipakai untuk operasi yang memerlukan privilege di luar user session,
 * misal auto-create institution_users mapping saat demo / first login.
 */
function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY tidak terkonfigurasi");
  }
  return createServiceClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Get current user's institution context.
 *
 * Resolution order:
 *   1. Cek mapping di `institution_users` untuk auth.uid() yang sedang login
 *   2. Kalau belum ada → demo fallback: auto-assign ke institusi pertama yang aktif
 *      sebagai admin, lewat service role (bypass RLS).
 *
 * Demo fallback ini mempermudah testing tanpa perlu setup user-institution mapping
 * manual. Di production, hapus fallback dan paksa onboarding eksplisit.
 */
export async function getCurrentInstitution(): Promise<InstitutionContext | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Cek existing membership pakai user session (RLS-aware)
  const { data: existing } = await supabase
    .from("institution_users")
    .select("institution_id, role, institutions!inner(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const m = existing as unknown as {
      institution_id: string;
      role: "admin" | "supervisor" | "reviewer";
      institutions: { name: string };
    };
    return {
      institutionId: m.institution_id,
      institutionName: m.institutions.name,
      role: m.role,
      userId: user.id,
    };
  }

  // 2. Demo fallback — pakai service role untuk auto-create mapping
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn("[institution] no membership and SERVICE_ROLE not configured");
    return null;
  }

  const admin = adminClient();

  // Race-safe: re-cek dengan service role (mungkin parallel request sudah create)
  const { data: existingAdminCheck } = await admin
    .from("institution_users")
    .select("institution_id, role, institutions!inner(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingAdminCheck) {
    const m = existingAdminCheck as unknown as {
      institution_id: string;
      role: "admin" | "supervisor" | "reviewer";
      institutions: { name: string };
    };
    return {
      institutionId: m.institution_id,
      institutionName: m.institutions.name,
      role: m.role,
      userId: user.id,
    };
  }

  // Pilih institusi pertama (alphabetical) yang status=active
  const { data: firstInst } = await admin
    .from("institutions")
    .select("id, name")
    .eq("status", "active")
    .order("name")
    .limit(1)
    .maybeSingle();

  if (!firstInst) {
    console.warn("[institution] no active institution available for demo fallback");
    return null;
  }

  // Insert mapping
  const { error: insertErr } = await admin.from("institution_users").insert({
    user_id: user.id,
    institution_id: firstInst.id,
    role: "admin",
  });

  if (insertErr) {
    // 23505 = unique violation (mapping baru saja dibuat oleh request lain — race)
    if (insertErr.code !== "23505") {
      console.warn("[institution] failed to auto-create mapping:", insertErr.message);
      return null;
    }
  }

  return {
    institutionId: firstInst.id,
    institutionName: firstInst.name,
    role: "admin",
    userId: user.id,
  };
}
