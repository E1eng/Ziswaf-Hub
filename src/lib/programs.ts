"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY,
  type FundType,
  type AsnafKey,
  type AssistanceType,
} from "@/lib/constants/ziswaf";

export interface CreateProgramInput {
  institutionId: string;
  name: string;
  description?: string;
  fundType: FundType;
  assistanceType: AssistanceType;
  targetAsnaf: AsnafKey[];
  sector?: string;
  budget: number;
  periodStart: string; // ISO date
  periodEnd: string;
  beneficiaryTarget?: number;
  programType: "RUTIN" | "PROPOSAL" | "INSIDENTIL";
}

export interface CreateProgramResult {
  success: boolean;
  programId?: string;
  error?: string;
}

export async function createProgram(input: CreateProgramInput): Promise<CreateProgramResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  // Client-side validation guards (DB CHECK constraint juga akan reject)
  if (!input.name.trim()) return { success: false, error: "Nama program wajib diisi" };
  if (input.budget <= 0) return { success: false, error: "Anggaran harus lebih dari 0" };
  if (input.targetAsnaf.length === 0) {
    return { success: false, error: "Pilih minimal satu kategori asnaf target" };
  }
  if (input.fundType === "wakaf") {
    return {
      success: false,
      error: "Wakaf tidak bisa via wizard alokasi (modul terpisah, post-hackathon)",
    };
  }
  if (new Date(input.periodEnd) < new Date(input.periodStart)) {
    return { success: false, error: "Tanggal akhir periode harus setelah tanggal mulai" };
  }

  const { data: prog, error } = await supabase
    .from("programs")
    .insert({
      institution_id: input.institutionId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      fund_type: input.fundType,
      assistance_type: input.assistanceType,
      target_asnaf: input.targetAsnaf,
      sector: input.sector?.trim() || null,
      budget: input.budget,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      beneficiary_target: input.beneficiaryTarget ?? 0,
      program_type: input.programType,
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (error || !prog) {
    return { success: false, error: error?.message ?? "Gagal membuat program" };
  }

  await logAudit(supabase, {
    action: AUDIT_ACTIONS.PROGRAM_CREATED,
    entityType: AUDIT_ENTITY.PROGRAM,
    entityId: prog.id,
    actorId: user.id,
    institutionId: input.institutionId,
    payload: {
      name: input.name,
      fund_type: input.fundType,
      assistance_type: input.assistanceType,
      target_asnaf: input.targetAsnaf,
      budget: input.budget,
    },
  });

  return { success: true, programId: prog.id };
}

export async function updateProgramStatus(
  programId: string,
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELED"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terotentikasi" };

  const { data, error } = await supabase
    .from("programs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", programId)
    .select("institution_id, name")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Gagal update status program" };
  }

  const action = status === "ACTIVE"
    ? AUDIT_ACTIONS.PROGRAM_ACTIVATED
    : status === "COMPLETED"
    ? AUDIT_ACTIONS.PROGRAM_COMPLETED
    : AUDIT_ACTIONS.PROGRAM_CREATED; // fallback

  await logAudit(supabase, {
    action,
    entityType: AUDIT_ENTITY.PROGRAM,
    entityId: programId,
    actorId: user.id,
    institutionId: data.institution_id,
    payload: { status, name: data.name },
  });

  return { success: true };
}
