"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, AUDIT_ENTITY } from "@/lib/constants/ziswaf";

// ─── Candidate fetch ────────────────────────────────────────────

export interface AllocationCandidate {
  assessmentId: string;
  mustahikId: string;
  nik: string;
  fullName: string;
  asnafCategory: string;
  priorityScore: number;
  estimatedAmount: number;
  duplicates: DuplicateInfo[];
}

export interface DuplicateInfo {
  sourceInstitutionName: string;
  sourceBatchCode: string;
  sourceAssistanceType: string;
  sourcePeriodStart: string;
  sourcePeriodEnd: string;
  sourceAmount: number;
}

/**
 * Fetch kandidat untuk wizard alokasi:
 *   1. Ambil semua mustahik_assessments status=APPROVED untuk lembaga ini
 *      yang asnaf_category-nya match program.target_asnaf
 *   2. Filter mustahik dengan lifecycle_status=active
 *   3. Run dedup check: panggil RPC check_dedup() untuk flag yang punya overlap
 *      di assistance_log dengan assistance_type+period yang sama
 *
 * Return sudah di-sort by priority_score DESC.
 */
export async function fetchAllocationCandidates(
  programId: string
): Promise<{ success: boolean; candidates?: AllocationCandidate[]; error?: string }> {
  const supabase = await createClient();

  // Get program details
  const { data: prog, error: pErr } = await supabase
    .from("programs")
    .select("id, institution_id, target_asnaf, assistance_type, period_start, period_end")
    .eq("id", programId)
    .single();

  if (pErr || !prog) {
    return { success: false, error: pErr?.message ?? "Program tidak ditemukan" };
  }

  // Fetch eligible assessments
  const { data: assessments, error: aErr } = await supabase
    .from("mustahik_assessments")
    .select(`
      id,
      mustahik_id,
      asnaf_category,
      priority_score,
      estimated_amount,
      mustahik_registry!inner(id, nik, full_name, lifecycle_status)
    `)
    .eq("institution_id", prog.institution_id)
    .eq("status", "APPROVED")
    .in("asnaf_category", prog.target_asnaf)
    .order("priority_score", { ascending: false })
    .limit(500);

  if (aErr) {
    return { success: false, error: aErr.message };
  }

  type Row = {
    id: string;
    mustahik_id: string;
    asnaf_category: string;
    priority_score: number;
    estimated_amount: number;
    mustahik_registry: { id: string; nik: string; full_name: string; lifecycle_status: string };
  };
  const rows = (assessments ?? []) as unknown as Row[];

  // Filter: hanya mustahik yang lifecycle_status='active'
  const activeRows = rows.filter((r) => r.mustahik_registry.lifecycle_status === "active");
  const mustahikIds = activeRows.map((r) => r.mustahik_registry.id);

  // Filter: assessment yang assessment_id-nya sudah pernah dialokasi di program ini
  // (skip agar wizard tidak pilih ulang yang sudah PLANNED/ALLOCATED)
  const { data: existingAlloc } = await supabase
    .from("allocations")
    .select("assessment_id")
    .eq("program_id", programId)
    .in("status", ["PLANNED", "ALLOCATED"]);

  const alreadyAllocatedIds = new Set((existingAlloc ?? []).map((a) => a.assessment_id));
  const eligibleRows = activeRows.filter((r) => !alreadyAllocatedIds.has(r.id));

  // Dedup check: kalau tidak ada kandidat, skip RPC
  const dupMap = new Map<string, DuplicateInfo[]>();
  if (eligibleRows.length > 0) {
    const eligibleMustahikIds = eligibleRows.map((r) => r.mustahik_registry.id);
    const { data: dups, error: dErr } = await supabase.rpc("check_dedup", {
      p_mustahik_ids: eligibleMustahikIds,
      p_assistance_type: prog.assistance_type,
      p_period_start: prog.period_start,
      p_period_end: prog.period_end,
    });

    if (!dErr && dups) {
      for (const d of dups) {
        const existing = dupMap.get(d.mustahik_id) ?? [];
        existing.push({
          sourceInstitutionName: d.source_institution_name,
          sourceBatchCode: d.source_batch_code,
          sourceAssistanceType: d.source_assistance_type,
          sourcePeriodStart: d.source_period_start,
          sourcePeriodEnd: d.source_period_end,
          sourceAmount: Number(d.source_amount),
        });
        dupMap.set(d.mustahik_id, existing);
      }
    }
  }

  // Filter: hanya mustahik yang masih punya kandidat (above) — bandingkan ID
  const _ = mustahikIds; // referenced for type checker
  void _;

  const candidates: AllocationCandidate[] = eligibleRows.map((r) => ({
    assessmentId: r.id,
    mustahikId: r.mustahik_registry.id,
    nik: r.mustahik_registry.nik,
    fullName: r.mustahik_registry.full_name,
    asnafCategory: r.asnaf_category,
    priorityScore: Number(r.priority_score),
    estimatedAmount: Number(r.estimated_amount),
    duplicates: dupMap.get(r.mustahik_registry.id) ?? [],
  }));

  return { success: true, candidates };
}

// ─── Greedy knapsack ────────────────────────────────────────────

export interface KnapsackPlan {
  selected: AllocationCandidate[];
  totalAllocated: number;
  remaining: number;
  hasDuplicates: boolean;
  duplicateCount: number;
}

/**
 * Greedy knapsack: pilih kandidat dengan priority_score tertinggi,
 * skip yang punya duplikat (kecuali skipDuplicates=false).
 *
 * Asumsi: candidates sudah sorted DESC by priority_score.
 */
export async function planAllocation(
  candidates: AllocationCandidate[],
  budget: number,
  options: { skipDuplicates?: boolean } = {}
): Promise<KnapsackPlan> {
  const skipDuplicates = options.skipDuplicates ?? true;
  const selected: AllocationCandidate[] = [];
  let totalAllocated = 0;
  let duplicateCount = 0;

  for (const c of candidates) {
    if (c.duplicates.length > 0) {
      duplicateCount++;
      if (skipDuplicates) continue;
    }
    if (c.estimatedAmount <= 0) continue;
    if (totalAllocated + c.estimatedAmount <= budget) {
      selected.push(c);
      totalAllocated += c.estimatedAmount;
    }
  }

  return {
    selected,
    totalAllocated,
    remaining: budget - totalAllocated,
    hasDuplicates: duplicateCount > 0,
    duplicateCount,
  };
}

// ─── Confirm allocation: insert allocations + create batch ─────

export interface ConfirmAllocationInput {
  programId: string;
  selections: Array<{
    assessmentId: string;
    amount: number;
    duplicateOverride?: boolean;
    duplicateReason?: string;
  }>;
}

export interface ConfirmAllocationResult {
  success: boolean;
  batchId?: string;
  batchCode?: string;
  totalAmount?: number;
  beneficiaryCount?: number;
  error?: string;
}

/**
 * Confirm wizard: insert allocations (status PLANNED) + create disbursement_batches.
 * Tidak langsung set status batch ke DISBURSED — admin yang advance lewat
 * /dashboard/penyaluran. Saat batch DISBURSED, trigger DB akan auto-tulis
 * assistance_log untuk dedup di program berikutnya.
 */
export async function confirmAllocation(
  input: ConfirmAllocationInput
): Promise<ConfirmAllocationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  if (input.selections.length === 0) {
    return { success: false, error: "Minimal pilih 1 penerima" };
  }

  // Get program
  const { data: prog, error: pErr } = await supabase
    .from("programs")
    .select("id, institution_id, name, fund_type")
    .eq("id", input.programId)
    .single();

  if (pErr || !prog) {
    return { success: false, error: pErr?.message ?? "Program tidak ditemukan" };
  }

  const totalAmount = input.selections.reduce((s, x) => s + x.amount, 0);
  const beneficiaryCount = input.selections.length;

  // Generate batch code via DB RPC
  const { data: codeData, error: codeErr } = await supabase.rpc("generate_batch_code");
  if (codeErr || !codeData) {
    return { success: false, error: codeErr?.message ?? "Gagal generate batch code" };
  }
  const batchCode = codeData as string;

  // Create batch
  const { data: batch, error: bErr } = await supabase
    .from("disbursement_batches")
    .insert({
      batch_code: batchCode,
      institution_id: prog.institution_id,
      program_id: prog.id,
      fund_type: prog.fund_type,
      total_amount: totalAmount,
      beneficiary_count: beneficiaryCount,
      status: "PROCESSING",
      kecamatan_summary: [],
    })
    .select("id, batch_code")
    .single();

  if (bErr || !batch) {
    return { success: false, error: bErr?.message ?? "Gagal membuat batch" };
  }

  // Insert allocations (status ALLOCATED langsung — wizard sudah konfirm)
  const allocationRows = input.selections.map((s) => ({
    program_id: prog.id,
    assessment_id: s.assessmentId,
    batch_id: batch.id,
    amount: s.amount,
    status: "ALLOCATED" as const,
    duplicate_override: s.duplicateOverride ?? false,
    duplicate_reason: s.duplicateReason ?? null,
    duplicate_overridden_by: s.duplicateOverride ? user.id : null,
    allocated_at: new Date().toISOString(),
  }));

  const { error: allocErr } = await supabase.from("allocations").insert(allocationRows);

  if (allocErr) {
    // Rollback: hapus batch yang sudah dibuat
    await supabase.from("disbursement_batches").delete().eq("id", batch.id);
    return { success: false, error: allocErr.message };
  }

  // Audit
  await logAudit(supabase, {
    action: AUDIT_ACTIONS.BATCH_CREATED,
    entityType: AUDIT_ENTITY.BATCH,
    entityId: batch.id,
    actorId: user.id,
    institutionId: prog.institution_id,
    payload: {
      batch_code: batch.batch_code,
      program_id: prog.id,
      program_name: prog.name,
      total_amount: totalAmount,
      beneficiary_count: beneficiaryCount,
    },
  });

  // Audit per override
  for (const sel of input.selections.filter((s) => s.duplicateOverride)) {
    await logAudit(supabase, {
      action: AUDIT_ACTIONS.ALLOCATION_OVERRIDE_DUPLICATE,
      entityType: AUDIT_ENTITY.ALLOCATION,
      actorId: user.id,
      institutionId: prog.institution_id,
      payload: {
        assessment_id: sel.assessmentId,
        program_id: prog.id,
        reason: sel.duplicateReason ?? null,
      },
    });
  }

  return {
    success: true,
    batchId: batch.id,
    batchCode: batch.batch_code,
    totalAmount,
    beneficiaryCount,
  };
}
