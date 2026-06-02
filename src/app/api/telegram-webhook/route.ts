import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Telegram webhook — terima submission proposal dari bot lapangan.
 *
 * Skor prioritas dihitung otomatis di DB lewat trigger `trg_proposal_priority`
 * → kita tidak duplikasi logic di sini.
 *
 * Estimasi nominal alokasi awal di-set lewat baseline per asnaf.
 * Reviewer di dashboard yang akan melakukan adjustment final.
 */

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TelegramPayload {
  nik: string;
  full_name: string;
  kecamatan_id?: string;
  asnaf_category: string;
  metrics: {
    monthly_income?: number;
    dependents?: number;
    housing?: string;
    disability?: boolean;
    employment_status?: string;
  };
}

const VALID_ASNAF = new Set([
  "fakir", "miskin", "amil", "mualaf",
  "riqab", "gharimin", "fisabilillah", "ibnu_sabil",
]);

/**
 * Estimasi awal alokasi per asnaf — hanya sebagai default,
 * reviewer tetap bisa override di dashboard.
 */
function estimateAllocation(asnaf: string, dependents: number): number {
  const baseAmounts: Record<string, number> = {
    fakir: 2_500_000,
    miskin: 2_000_000,
    gharimin: 1_500_000,
    ibnu_sabil: 1_200_000,
    mualaf: 1_000_000,
    fisabilillah: 800_000,
    riqab: 800_000,
    amil: 500_000,
  };
  const base = baseAmounts[asnaf] ?? 1_000_000;
  const safeDeps = Math.max(0, dependents);
  return base + Math.max(0, safeDeps - 1) * 300_000;
}

export async function POST(request: NextRequest) {
  let body: TelegramPayload;
  try {
    body = (await request.json()) as TelegramPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Required fields
  if (!body.nik || !body.full_name || !body.asnaf_category) {
    return NextResponse.json(
      { error: "Missing required fields: nik, full_name, asnaf_category" },
      { status: 400 }
    );
  }

  // NIK 16 digits
  if (!/^\d{16}$/.test(body.nik)) {
    return NextResponse.json({ error: "NIK must be exactly 16 digits" }, { status: 400 });
  }

  // Asnaf validation
  if (!VALID_ASNAF.has(body.asnaf_category)) {
    return NextResponse.json(
      { error: `Invalid asnaf_category. Must be one of: ${[...VALID_ASNAF].join(", ")}` },
      { status: 400 }
    );
  }

  const metrics = body.metrics ?? {};
  const allocatedAmount = estimateAllocation(body.asnaf_category, metrics.dependents ?? 1);

  const { data, error } = await supabase
    .from("mustahik_proposals")
    .insert({
      nik: body.nik,
      full_name: body.full_name,
      kecamatan_id: body.kecamatan_id ?? null,
      asnaf_category: body.asnaf_category,
      metrics,
      allocated_amount: allocatedAmount,
      source: "TELEGRAM",
      status: "PENDING",
    })
    .select("id, priority_score, allocated_amount, status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Proposal aktif dengan NIK ini sudah ada" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log — match audit_ledger schema (action, entity_type, entity_id, payload)
  // Errors swallowed so audit failure doesn't break the webhook contract.
  const { error: auditError } = await supabase.from("audit_ledger").insert({
    action: "PROPOSAL_SUBMITTED",
    entity_type: "mustahik_proposal",
    entity_id: data.id,
    payload: { source: "TELEGRAM", asnaf: body.asnaf_category },
  });
  if (auditError) {
    console.warn("[telegram-webhook] audit insert failed:", auditError.message);
  }

  return NextResponse.json({
    success: true,
    proposal: data,
    message: `Proposal diterima. Skor prioritas: ${data.priority_score}`,
  });
}
