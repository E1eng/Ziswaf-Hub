"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY,
  type AsnafKey,
} from "@/lib/constants/ziswaf";
import { estimateAssistanceAmount } from "@/lib/estimate";

export interface QuickAssessmentInput {
  institutionId: string;
  // Mustahik identity
  nik: string;
  fullName: string;
  kecamatanId?: string | null;
  phone?: string | null;
  // Assessment
  asnafCategory: AsnafKey;
  monthlyIncome: number;
  dependents: number;
  housing: "owned" | "rental" | "family" | "homeless";
  isOrphan?: boolean;
  estimatedAmount?: number;
  notes?: string;
}

export interface QuickAssessmentResult {
  success: boolean;
  mustahikId?: string;
  assessmentId?: string;
  priorityScore?: number;
  isNewMustahik?: boolean;
  error?: string;
}

/**
 * Quick-create mustahik + assessment dalam satu transaksi (logical).
 * Kalau NIK sudah ada di registry, reuse. Kalau ada assessment aktif dari lembaga
 * yang sama, error 409.
 */
export async function quickCreateAssessment(
  input: QuickAssessmentInput
): Promise<QuickAssessmentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  // Validate NIK
  if (!/^\d{16}$/.test(input.nik)) {
    return { success: false, error: "NIK harus 16 digit angka" };
  }
  if (!input.fullName.trim()) {
    return { success: false, error: "Nama wajib diisi" };
  }

  // 1. Find or create mustahik
  let mustahikId: string;
  let isNewMustahik = false;

  const { data: existing } = await supabase
    .from("mustahik_registry")
    .select("id")
    .eq("nik", input.nik)
    .maybeSingle();

  if (existing) {
    mustahikId = existing.id;
  } else {
    const { data: newMustahik, error: mErr } = await supabase
      .from("mustahik_registry")
      .insert({
        nik: input.nik,
        full_name: input.fullName.trim(),
        kecamatan_id: input.kecamatanId ?? null,
        phone: input.phone ?? null,
        first_registered_by_institution_id: input.institutionId,
        pdp_consent_at: new Date().toISOString(),
        pdp_consent_collected_by_institution_id: input.institutionId,
      })
      .select("id")
      .single();

    if (mErr || !newMustahik) {
      return { success: false, error: mErr?.message ?? "Gagal mendaftarkan mustahik" };
    }
    mustahikId = newMustahik.id;
    isNewMustahik = true;

    await logAudit(supabase, {
      action: AUDIT_ACTIONS.MUSTAHIK_REGISTERED,
      entityType: AUDIT_ENTITY.MUSTAHIK,
      entityId: mustahikId,
      actorId: user.id,
      institutionId: input.institutionId,
      payload: { nik_masked: input.nik.slice(0, 4) + "****" + input.nik.slice(-4) },
    });
  }

  // 2. Create assessment (priority_score auto-dihitung trigger)
  const { data: assess, error: aErr } = await supabase
    .from("mustahik_assessments")
    .insert({
      mustahik_id: mustahikId,
      institution_id: input.institutionId,
      asnaf_category: input.asnafCategory,
      metrics: {
        monthly_income: input.monthlyIncome,
        dependents: input.dependents,
        housing: input.housing,
        is_orphan: input.isOrphan ?? false,
      },
      estimated_amount:
        input.estimatedAmount && input.estimatedAmount > 0
          ? input.estimatedAmount
          : estimateAssistanceAmount({
              asnaf: input.asnafCategory,
              monthlyIncome: input.monthlyIncome,
              dependents: input.dependents,
              housing: input.housing,
              isOrphan: input.isOrphan,
            }),
      source: "MANUAL",
      status: "PENDING",
    })
    .select("id, priority_score")
    .single();

  if (aErr || !assess) {
    if (aErr?.code === "23505") {
      return {
        success: false,
        error: "Mustahik ini sudah memiliki assessment aktif di lembaga Anda",
      };
    }
    return { success: false, error: aErr?.message ?? "Gagal membuat assessment" };
  }

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.ASSESSMENT_SUBMITTED,
    entityType: AUDIT_ENTITY.ASSESSMENT,
    entityId: assess.id,
    actorId: user.id,
    institutionId: input.institutionId,
    payload: {
      mustahik_id: mustahikId,
      asnaf: input.asnafCategory,
      source: "MANUAL",
    },
  });

  return {
    success: true,
    mustahikId,
    assessmentId: assess.id,
    priorityScore: Number(assess.priority_score),
    isNewMustahik,
  };
}

export async function approveAssessment(
  assessmentId: string,
  reviewNote?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  const { data: assess, error } = await supabase
    .from("mustahik_assessments")
    .update({
      status: "APPROVED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_note: reviewNote ?? null,
    })
    .eq("id", assessmentId)
    .select("institution_id")
    .single();

  if (error || !assess) {
    return { success: false, error: error?.message ?? "Gagal approve assessment" };
  }

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.ASSESSMENT_APPROVED,
    entityType: AUDIT_ENTITY.ASSESSMENT,
    entityId: assessmentId,
    actorId: user.id,
    institutionId: assess.institution_id,
    payload: { note: reviewNote ?? null },
  });

  return { success: true };
}

export async function rejectAssessment(
  assessmentId: string,
  reviewNote?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  const { data: assess, error } = await supabase
    .from("mustahik_assessments")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_note: reviewNote ?? null,
    })
    .eq("id", assessmentId)
    .select("institution_id")
    .single();

  if (error || !assess) {
    return { success: false, error: error?.message ?? "Gagal reject assessment" };
  }

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.ASSESSMENT_REJECTED,
    entityType: AUDIT_ENTITY.ASSESSMENT,
    entityId: assessmentId,
    actorId: user.id,
    institutionId: assess.institution_id,
    payload: { note: reviewNote ?? null },
  });

  return { success: true };
}

export async function bulkApproveAssessments(
  assessmentIds: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };
  if (assessmentIds.length === 0) return { success: true, count: 0 };

  const { data, error } = await supabase
    .from("mustahik_assessments")
    .update({
      status: "APPROVED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .in("id", assessmentIds)
    .select("id, institution_id");

  if (error) {
    return { success: false, error: error.message };
  }

  // Audit batch (1 row per institution)
  const byInst = new Map<string, string[]>();
  for (const row of data ?? []) {
    const arr = byInst.get(row.institution_id) ?? [];
    arr.push(row.id);
    byInst.set(row.institution_id, arr);
  }

  for (const [institutionId, ids] of byInst) {
    await logAudit(supabase, {
      action: AUDIT_ACTIONS.ASSESSMENT_APPROVED,
      entityType: AUDIT_ENTITY.ASSESSMENT,
      actorId: user.id,
      institutionId,
      payload: { bulk: true, count: ids.length, ids },
    });
  }

  return { success: true, count: data?.length ?? 0 };
}
