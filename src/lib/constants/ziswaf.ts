/**
 * Konstanta domain ZISWAF — single source of truth.
 * Hindari duplikasi mapping label/status di tiap halaman.
 */

import type { LucideIcon } from "lucide-react";
import {
  Clock,
  CheckCircle,
  PackageCheck,
  ShieldCheck,
  Truck,
  Package,
  AlertTriangle,
} from "lucide-react";

// ── 8 ASNAF ──────────────────────────────────────────────
export const ASNAF_KEYS = [
  "fakir", "miskin", "amil", "mualaf",
  "riqab", "gharimin", "fisabilillah", "ibnu_sabil",
] as const;

export type AsnafKey = (typeof ASNAF_KEYS)[number];

export const ASNAF_LABELS: Record<AsnafKey, string> = {
  fakir: "Fakir",
  miskin: "Miskin",
  amil: "Amil",
  mualaf: "Mualaf",
  riqab: "Riqab",
  gharimin: "Gharimin",
  fisabilillah: "Fisabilillah",
  ibnu_sabil: "Ibnu Sabil",
};

export function asnafLabel(key: string): string {
  return ASNAF_LABELS[key as AsnafKey] || key.replace("_", " ");
}

// ── PROPOSAL STATUS ─────────────────────────────────────
export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISBURSED";

export const PROPOSAL_STATUS: Record<
  ProposalStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Menunggu", variant: "secondary" },
  APPROVED: { label: "Disetujui", variant: "default" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  DISBURSED: { label: "Disalurkan", variant: "outline" },
};

// ── BATCH STATUS (Shopee-style timeline) ────────────────
export const BATCH_STATUS_FLOW = ["PROCESSING", "VERIFIED", "DISBURSED", "RECEIVED"] as const;
export type BatchStatus = (typeof BATCH_STATUS_FLOW)[number];

export const BATCH_STATUS: Record<
  BatchStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  PROCESSING: { label: "Diproses", color: "bg-blue-100 text-blue-800", icon: Package },
  VERIFIED: { label: "Terverifikasi", color: "bg-amber-100 text-amber-800", icon: ShieldCheck },
  DISBURSED: { label: "Disalurkan", color: "bg-green-100 text-green-800", icon: Truck },
  RECEIVED: { label: "Diterima", color: "bg-emerald-100 text-emerald-800", icon: PackageCheck },
};

export function nextBatchStatus(current: string): BatchStatus | null {
  const idx = BATCH_STATUS_FLOW.indexOf(current as BatchStatus);
  if (idx === -1 || idx >= BATCH_STATUS_FLOW.length - 1) return null;
  return BATCH_STATUS_FLOW[idx + 1];
}

// ── BENEFICIARY STATUS (program beneficiaries) ──────────
export type BeneficiaryStatus = "PENDING" | "VALIDATED" | "DUPLICATE" | "DISBURSED";

export const BENEFICIARY_STATUS: Record<
  BeneficiaryStatus,
  { label: string; icon: LucideIcon; color: string }
> = {
  PENDING: { label: "Menunggu", icon: Clock, color: "text-muted-foreground" },
  VALIDATED: { label: "Tervalidasi", icon: CheckCircle, color: "text-green-500" },
  DUPLICATE: { label: "Duplikat", icon: AlertTriangle, color: "text-amber-500" },
  DISBURSED: { label: "Disalurkan", icon: Package, color: "text-blue-500" },
};

// ── PROGRAM TYPE ────────────────────────────────────────
export type ProgramType = "RUTIN" | "PROPOSAL" | "INSIDENTIL";

export const PROGRAM_TYPE: Record<ProgramType, { label: string; color: string }> = {
  RUTIN: { label: "Rutin", color: "bg-blue-500" },
  PROPOSAL: { label: "Dari Proposal", color: "bg-purple-500" },
  INSIDENTIL: { label: "Insidentil", color: "bg-amber-500" },
};

// ── PROGRAM STATUS ──────────────────────────────────────
export type ProgramStatus = "DRAFT" | "ACTIVE" | "COMPLETED";

export const PROGRAM_STATUS: Record<
  ProgramStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ACTIVE: { label: "Aktif", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
};

// ── DISTRIBUTION SECTORS ────────────────────────────────
export const SECTOR_OPTIONS = [
  { value: "ekonomi", label: "Ekonomi" },
  { value: "pendidikan", label: "Pendidikan" },
  { value: "kesehatan", label: "Kesehatan" },
  { value: "kemanusiaan", label: "Kemanusiaan" },
  { value: "dakwah", label: "Dakwah & Advokasi" },
];

// ── HOUSING (proposal metric) ───────────────────────────
export const HOUSING_OPTIONS = [
  { value: "owned", label: "Milik Sendiri" },
  { value: "rental", label: "Sewa/Kontrak" },
  { value: "family", label: "Numpang Keluarga" },
  { value: "homeless", label: "Tidak Punya" },
];

// ── BATCH CODE GENERATOR ────────────────────────────────
export function generateBatchCode(prefix = "ZH"): string {
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  return `${prefix}-${year}-${random}`;
}

// ── AUDIT LEDGER HELPERS ────────────────────────────────
/**
 * Common audit actions used across the app.
 * Keep as string literals so future actions don't break TS.
 */
export const AUDIT_ACTIONS = {
  PROPOSAL_SUBMITTED: "PROPOSAL_SUBMITTED",
  PROPOSAL_APPROVED: "PROPOSAL_APPROVED",
  PROPOSAL_REJECTED: "PROPOSAL_REJECTED",
  PROPOSAL_DISBURSED: "PROPOSAL_DISBURSED",
  BATCH_CREATED: "BATCH_CREATED",
  BATCH_STATUS_UPDATED: "BATCH_STATUS_UPDATED",
  PROGRAM_CREATED: "PROGRAM_CREATED",
  PROGRAM_BATCH_CREATED: "PROGRAM_BATCH_CREATED",
} as const;

export const AUDIT_ENTITY = {
  MUSTAHIK_PROPOSAL: "mustahik_proposal",
  DISBURSEMENT_BATCH: "disbursement_batch",
  PROGRAM: "program",
  PROGRAM_BENEFICIARY: "program_beneficiary",
} as const;
