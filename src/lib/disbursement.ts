/**
 * Disbursement Gateway Orchestrator
 *
 * Architecture: "API Orchestrator" pattern
 * - Platform does NOT hold funds
 * - Uses institution's own payment gateway credentials
 * - Orchestrates disbursements via provider APIs
 * - Falls back to CSV export for manual Corporate Banking upload
 */

import { createClient } from "@/lib/supabase/client";

// ============================================================
// Types
// ============================================================

export type Provider = "MIDTRANS" | "XENDIT" | "FLIP" | "BANK_CSV";
export type FundType = "ZAKAT" | "INFAQ" | "WAKAF";

export interface DisbursementItem {
  region_name: string;
  beneficiary_name?: string;
  bank_code?: string;
  account_number?: string;
  amount: number;
  description: string;
}

export interface DisbursementRequest {
  institution_id: string;
  fund_type: FundType;
  total_amount: number;
  reference_id: string;
  description: string;
  items: DisbursementItem[];
}

export interface DisbursementResult {
  success: boolean;
  provider: Provider;
  method: "API" | "CSV_DOWNLOAD";
  transaction_id?: string;
  error?: string;
  csv_data?: string;
  details?: Record<string, unknown>;
}

interface IntegrationRecord {
  id: string;
  provider: Provider;
  credentials: Record<string, string>;
  is_active: boolean;
}

// ============================================================
// Balance Check (Anti-Overdraft)
// ============================================================

export async function checkBalance(
  institutionId: string,
  fundType: FundType,
  amount: number
): Promise<{ sufficient: boolean; current_balance: number }> {
  const supabase = createClient();

  const { data } = await supabase
    .from("treasury_balances")
    .select("zakat_balance, infaq_balance, wakaf_balance")
    .eq("institution_id", institutionId)
    .single();

  if (!data) {
    return { sufficient: false, current_balance: 0 };
  }

  const balanceMap: Record<FundType, number> = {
    ZAKAT: Number(data.zakat_balance),
    INFAQ: Number(data.infaq_balance),
    WAKAF: Number(data.wakaf_balance),
  };

  const current = balanceMap[fundType];
  return {
    sufficient: current >= amount,
    current_balance: current,
  };
}

// ============================================================
// Get Active Integration
// ============================================================

export async function getActiveIntegration(
  institutionId: string
): Promise<IntegrationRecord | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from("institution_integrations")
    .select("id, provider, credentials, is_active")
    .eq("institution_id", institutionId)
    .eq("is_active", true)
    .limit(1)
    .single();

  return (data as IntegrationRecord) || null;
}

// ============================================================
// Provider-Specific Disbursement Wrappers
// ============================================================

/**
 * Xendit Disbursement API (simulated)
 * Real endpoint: POST https://api.xendit.co/batch_disbursements
 */
async function disbursementXendit(
  credentials: Record<string, string>,
  request: DisbursementRequest
): Promise<DisbursementResult> {
  const { secret_key } = credentials;

  // Simulated API call structure
  const payload = {
    reference: request.reference_id,
    disbursements: request.items.map((item, idx) => ({
      amount: item.amount,
      bank_code: item.bank_code || "BSI",
      bank_account_name: item.beneficiary_name || `Penerima ${idx + 1}`,
      bank_account_number: item.account_number || "0000000000",
      description: item.description,
      external_id: `${request.reference_id}-${idx}`,
    })),
  };

  // In production: actual fetch to Xendit API
  // const response = await fetch("https://api.xendit.co/batch_disbursements", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Basic ${btoa(secret_key + ":")}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(payload),
  // });

  console.log("[XENDIT] Simulated disbursement:", {
    auth: `Basic ${secret_key?.slice(0, 8)}...`,
    items: payload.disbursements.length,
    total: request.total_amount,
  });

  // Simulated success response
  return {
    success: true,
    provider: "XENDIT",
    method: "API",
    transaction_id: `xnd_batch_${Date.now()}`,
    details: {
      batch_id: `xnd_batch_${Date.now()}`,
      total_disbursed: request.total_amount,
      items_count: request.items.length,
      status: "ACCEPTED",
    },
  };
}

/**
 * Midtrans Iris Payout API (simulated)
 * Real endpoint: POST https://app.midtrans.com/iris/api/v1/payouts
 */
async function disbursementMidtrans(
  credentials: Record<string, string>,
  request: DisbursementRequest
): Promise<DisbursementResult> {
  const { server_key } = credentials;

  const payload = {
    payouts: request.items.map((item, idx) => ({
      beneficiary_name: item.beneficiary_name || `Penerima ${idx + 1}`,
      beneficiary_account: item.account_number || "0000000000",
      beneficiary_bank: item.bank_code || "bsi",
      amount: item.amount.toString(),
      notes: item.description,
    })),
  };

  // In production: actual fetch to Midtrans Iris API
  // const response = await fetch("https://app.midtrans.com/iris/api/v1/payouts", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Basic ${btoa(server_key + ":")}`,
  //     "Content-Type": "application/json",
  //     "X-Idempotency-Key": request.reference_id,
  //   },
  //   body: JSON.stringify(payload),
  // });

  console.log("[MIDTRANS] Simulated payout:", {
    auth: `Basic ${server_key?.slice(0, 8)}...`,
    items: payload.payouts.length,
    total: request.total_amount,
  });

  return {
    success: true,
    provider: "MIDTRANS",
    method: "API",
    transaction_id: `mt_payout_${Date.now()}`,
    details: {
      reference_no: request.reference_id,
      total_amount: request.total_amount,
      payouts_count: request.items.length,
      status: "queued",
    },
  };
}

/**
 * Flip for Business Disbursement (simulated)
 * Real endpoint: POST https://bigflip.id/api/v3/disbursement
 */
async function disbursementFlip(
  credentials: Record<string, string>,
  request: DisbursementRequest
): Promise<DisbursementResult> {
  const { secret_key } = credentials;

  console.log("[FLIP] Simulated disbursement:", {
    auth: `Basic ${secret_key?.slice(0, 8)}...`,
    items: request.items.length,
    total: request.total_amount,
  });

  return {
    success: true,
    provider: "FLIP",
    method: "API",
    transaction_id: `flip_${Date.now()}`,
    details: {
      batch_id: `flip_batch_${Date.now()}`,
      total: request.total_amount,
      status: "PENDING",
    },
  };
}

/**
 * Bank CSV Export — generates CSV for Corporate Banking bulk transfer
 * Format compatible with BSI, BNI, Mandiri, BCA
 */
function generateBankCSV(
  credentials: Record<string, string>,
  request: DisbursementRequest
): DisbursementResult {
  const { bank_name, account_number, account_name } = credentials;

  const header = "No,Nama Penerima,Bank Tujuan,No Rekening,Jumlah,Keterangan";
  const rows = request.items.map((item, idx) => {
    return [
      idx + 1,
      `"${item.beneficiary_name || item.region_name}"`,
      `"${item.bank_code || "BSI"}"`,
      `"${item.account_number || "0000000000"}"`,
      item.amount,
      `"${item.description}"`,
    ].join(",");
  });

  const metaComment = [
    `# ZISWAF Hub - Bulk Transfer Export`,
    `# Bank Sumber: ${bank_name || "BSI"}`,
    `# Rekening Sumber: ${account_number || "-"} (${account_name || "-"})`,
    `# Tanggal: ${new Date().toLocaleDateString("id-ID")}`,
    `# Referensi: ${request.reference_id}`,
    `# Total: Rp ${request.total_amount.toLocaleString("id-ID")}`,
    `# Jumlah Transfer: ${request.items.length}`,
    "",
  ].join("\n");

  const csv_data = metaComment + header + "\n" + rows.join("\n");

  return {
    success: true,
    provider: "BANK_CSV",
    method: "CSV_DOWNLOAD",
    csv_data,
    details: {
      bank: bank_name,
      source_account: account_number,
      items_count: request.items.length,
      total: request.total_amount,
    },
  };
}

// ============================================================
// Main Disbursement Orchestrator
// ============================================================

export async function executeDisbursement(
  request: DisbursementRequest
): Promise<DisbursementResult> {
  // 1. Get active integration
  const integration = await getActiveIntegration(request.institution_id);

  if (!integration) {
    return {
      success: false,
      provider: "BANK_CSV",
      method: "CSV_DOWNLOAD",
      error: "Tidak ada integrasi yang aktif. Silakan konfigurasi di Pengaturan > Integrasi.",
    };
  }

  // 2. Route to provider-specific handler
  switch (integration.provider) {
    case "XENDIT":
      return disbursementXendit(integration.credentials, request);
    case "MIDTRANS":
      return disbursementMidtrans(integration.credentials, request);
    case "FLIP":
      return disbursementFlip(integration.credentials, request);
    case "BANK_CSV":
      return generateBankCSV(integration.credentials, request);
    default:
      return {
        success: false,
        provider: integration.provider,
        method: "API",
        error: `Provider ${integration.provider} tidak didukung.`,
      };
  }
}

// ============================================================
// Atomic Approve & Disburse (uses Supabase RPC)
// ============================================================

export async function approveAndDisburse(
  request: DisbursementRequest
): Promise<DisbursementResult> {
  const supabase = createClient();

  // 1. Anti-overdraft check
  const balanceCheck = await checkBalance(
    request.institution_id,
    request.fund_type,
    request.total_amount
  );

  if (!balanceCheck.sufficient) {
    return {
      success: false,
      provider: "BANK_CSV",
      method: "API",
      error: `Saldo tidak mencukupi. Saldo ${request.fund_type}: Rp ${balanceCheck.current_balance.toLocaleString("id-ID")}, dibutuhkan: Rp ${request.total_amount.toLocaleString("id-ID")}`,
    };
  }

  // 2. Execute atomic transaction via RPC (decrement balance + audit log)
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "process_disbursement",
    {
      p_institution_id: request.institution_id,
      p_fund_type: request.fund_type,
      p_amount: request.total_amount,
      p_reference_id: request.reference_id,
      p_description: request.description,
    }
  );

  if (rpcError) {
    return {
      success: false,
      provider: "BANK_CSV",
      method: "API",
      error: `Gagal memproses transaksi: ${rpcError.message}`,
    };
  }

  const result = rpcResult as { success: boolean; error?: string };
  if (!result.success) {
    return {
      success: false,
      provider: "BANK_CSV",
      method: "API",
      error: result.error === "INSUFFICIENT_BALANCE"
        ? "Saldo tidak mencukupi (validasi database)."
        : `Error: ${result.error}`,
    };
  }

  // 3. Execute disbursement via payment gateway
  const disbursementResult = await executeDisbursement(request);

  return disbursementResult;
}

// ============================================================
// CSV Download Helper (browser-side)
// ============================================================

export function triggerCSVDownload(csvData: string, filename: string) {
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
