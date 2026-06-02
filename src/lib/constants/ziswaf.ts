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
  Banknote,
  HandCoins,
  Heart,
  Wallet,
  Sparkles,
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

// 8 asnaf yang sah untuk fund_type=zakat & dskl
export const ZAKAT_VALID_ASNAF: AsnafKey[] = [...ASNAF_KEYS];

// ── FUND TYPE ────────────────────────────────────────────
export const FUND_TYPES = ["zakat", "infaq", "sedekah", "wakaf", "dskl"] as const;
export type FundType = (typeof FUND_TYPES)[number];

export const FUND_TYPE_CONFIG: Record<
  FundType,
  { label: string; description: string; icon: LucideIcon; color: string }
> = {
  zakat: { label: "Zakat", description: "Wajib, hanya ke 8 asnaf", icon: Banknote, color: "text-emerald-600" },
  infaq: { label: "Infaq", description: "Sukarela, bebas penyaluran", icon: HandCoins, color: "text-blue-600" },
  sedekah: { label: "Sedekah", description: "Sukarela, bebas penyaluran", icon: Heart, color: "text-rose-600" },
  wakaf: { label: "Wakaf", description: "Permanen, asset-based", icon: Wallet, color: "text-purple-600" },
  dskl: { label: "DSKL", description: "Dana Sosial Keagamaan Lainnya", icon: Sparkles, color: "text-amber-600" },
};

export function fundLabel(key: string): string {
  return FUND_TYPE_CONFIG[key as FundType]?.label ?? key.toUpperCase();
}

/** Asnaf yang valid untuk fund_type tertentu (mirror DB constraint). */
export function validAsnafForFund(fund: FundType): AsnafKey[] {
  switch (fund) {
    case "zakat":
    case "dskl":
      return ZAKAT_VALID_ASNAF;
    case "wakaf":
      return [];
    case "infaq":
    case "sedekah":
    default:
      return ZAKAT_VALID_ASNAF;
  }
}

// ── ASSISTANCE TYPE ──────────────────────────────────────
export const ASSISTANCE_TYPES = [
  "sembako", "beasiswa", "modal_usaha", "kesehatan",
  "tunai", "pelatihan", "dakwah", "rumah_layak",
  "kemanusiaan", "lainnya",
] as const;
export type AssistanceType = (typeof ASSISTANCE_TYPES)[number];

export const ASSISTANCE_TYPE_LABELS: Record<AssistanceType, string> = {
  sembako: "Sembako",
  beasiswa: "Beasiswa",
  modal_usaha: "Modal Usaha",
  kesehatan: "Kesehatan",
  tunai: "Bantuan Tunai",
  pelatihan: "Pelatihan / Pemberdayaan",
  dakwah: "Dakwah",
  rumah_layak: "Rumah Layak Huni",
  kemanusiaan: "Kemanusiaan / Bencana",
  lainnya: "Lainnya",
};

// ── ASSESSMENT STATUS (mengganti PROPOSAL_STATUS) ────────
export type AssessmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

export const ASSESSMENT_STATUS: Record<
  AssessmentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Menunggu Review", variant: "secondary" },
  APPROVED: { label: "Disetujui", variant: "default" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  ARCHIVED: { label: "Diarsipkan", variant: "outline" },
};

// ── BATCH STATUS (Shopee-style timeline) ─────────────────
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

// ── ALLOCATION STATUS ────────────────────────────────────
export type AllocationStatus = "PLANNED" | "ALLOCATED" | "CANCELED";

export const ALLOCATION_STATUS: Record<
  AllocationStatus,
  { label: string; icon: LucideIcon; color: string }
> = {
  PLANNED: { label: "Direncanakan", icon: Clock, color: "text-muted-foreground" },
  ALLOCATED: { label: "Dialokasikan", icon: CheckCircle, color: "text-green-500" },
  CANCELED: { label: "Dibatalkan", icon: AlertTriangle, color: "text-red-500" },
};

// ── PROGRAM TYPE ─────────────────────────────────────────
export type ProgramType = "RUTIN" | "PROPOSAL" | "INSIDENTIL";

export const PROGRAM_TYPE: Record<ProgramType, { label: string; color: string }> = {
  RUTIN: { label: "Rutin", color: "bg-blue-500" },
  PROPOSAL: { label: "Dari Proposal", color: "bg-purple-500" },
  INSIDENTIL: { label: "Insidentil", color: "bg-amber-500" },
};

// ── PROGRAM STATUS ───────────────────────────────────────
export type ProgramStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELED";

export const PROGRAM_STATUS: Record<
  ProgramStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ACTIVE: { label: "Aktif", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
  CANCELED: { label: "Dibatalkan", variant: "destructive" },
};

// ── MUSTAHIK LIFECYCLE ───────────────────────────────────
export type LifecycleStatus = "active" | "graduated" | "deceased" | "moved" | "flagged_invalid";

export const LIFECYCLE_STATUS: Record<
  LifecycleStatus,
  { label: string; description: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Aktif", description: "Masih layak menerima bantuan", variant: "default" },
  graduated: { label: "Mandiri", description: "Kondisi membaik, tidak lagi mustahik", variant: "secondary" },
  deceased: { label: "Meninggal", description: "Mustahik telah wafat", variant: "outline" },
  moved: { label: "Pindah", description: "Pindah ke wilayah lembaga lain", variant: "outline" },
  flagged_invalid: { label: "Tidak Valid", description: "Data terbukti tidak valid", variant: "destructive" },
};

// ── DONATION CHANNEL ─────────────────────────────────────
export const DONATION_CHANNELS = ["transfer", "cash", "ewallet", "payroll", "lainnya"] as const;
export type DonationChannel = (typeof DONATION_CHANNELS)[number];

export const DONATION_CHANNEL_LABELS: Record<DonationChannel, string> = {
  transfer: "Transfer Bank",
  cash: "Tunai",
  ewallet: "E-Wallet (OVO/Dana/dll)",
  payroll: "Potong Gaji",
  lainnya: "Lainnya",
};

// ── DISTRIBUTION SECTORS ─────────────────────────────────
export const SECTOR_OPTIONS = [
  { value: "ekonomi", label: "Ekonomi" },
  { value: "pendidikan", label: "Pendidikan" },
  { value: "kesehatan", label: "Kesehatan" },
  { value: "kemanusiaan", label: "Kemanusiaan" },
  { value: "dakwah", label: "Dakwah & Advokasi" },
];

// ── HOUSING (assessment metric) ──────────────────────────
export const HOUSING_OPTIONS = [
  { value: "owned", label: "Milik Sendiri" },
  { value: "rental", label: "Sewa/Kontrak" },
  { value: "family", label: "Numpang Keluarga" },
  { value: "homeless", label: "Tidak Punya" },
];

// ── CODE GENERATORS (client-side fallback; prefer DB RPC) ─
export function generateBatchCodeClient(prefix = "ZH"): string {
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  return `${prefix}-${year}-${random}`;
}

// ── AUDIT LEDGER ──────────────────────────────────────────
export const AUDIT_ACTIONS = {
  // Mustahik registry
  MUSTAHIK_REGISTERED: "MUSTAHIK_REGISTERED",
  MUSTAHIK_LIFECYCLE_CHANGED: "MUSTAHIK_LIFECYCLE_CHANGED",
  // Assessment
  ASSESSMENT_SUBMITTED: "ASSESSMENT_SUBMITTED",
  ASSESSMENT_APPROVED: "ASSESSMENT_APPROVED",
  ASSESSMENT_REJECTED: "ASSESSMENT_REJECTED",
  ASSESSMENT_FIELD_VERIFIED: "ASSESSMENT_FIELD_VERIFIED",
  // Donation
  DONATION_RECORDED: "DONATION_RECORDED",
  DONATION_EMAIL_SENT: "DONATION_EMAIL_SENT",
  // Program & allocation
  PROGRAM_CREATED: "PROGRAM_CREATED",
  PROGRAM_ACTIVATED: "PROGRAM_ACTIVATED",
  PROGRAM_COMPLETED: "PROGRAM_COMPLETED",
  ALLOCATION_PLANNED: "ALLOCATION_PLANNED",
  ALLOCATION_OVERRIDE_DUPLICATE: "ALLOCATION_OVERRIDE_DUPLICATE",
  // Batch
  BATCH_CREATED: "BATCH_CREATED",
  BATCH_STATUS_UPDATED: "BATCH_STATUS_UPDATED",
  // Field worker
  FIELD_WORKER_INVITED: "FIELD_WORKER_INVITED",
  FIELD_WORKER_ACTIVATED: "FIELD_WORKER_ACTIVATED",
  FIELD_WORKER_REVOKED: "FIELD_WORKER_REVOKED",
} as const;

export const AUDIT_ENTITY = {
  MUSTAHIK: "mustahik",
  ASSESSMENT: "mustahik_assessment",
  DONATION: "donation",
  PROGRAM: "program",
  ALLOCATION: "allocation",
  BATCH: "disbursement_batch",
  FIELD_WORKER: "field_worker",
  INSTITUTION: "institution",
} as const;
