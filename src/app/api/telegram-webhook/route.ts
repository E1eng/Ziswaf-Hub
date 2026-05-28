import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
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

function calculatePriorityScore(asnaf: string, metrics: TelegramPayload["metrics"]): number {
  let score = 0;
  const income = metrics.monthly_income ?? 2000000;
  const dependents = metrics.dependents ?? 1;

  // Income score: lower income = higher score (max 40)
  score += Math.max(0, Math.min(40, (2000000 - income) / 50000));

  // Dependents score (max 25)
  score += Math.min(25, dependents * 5);

  // Asnaf weight (max 20)
  const asnafWeights: Record<string, number> = {
    fakir: 20, miskin: 18, gharimin: 15, ibnu_sabil: 12,
    mualaf: 10, fisabilillah: 8, riqab: 8, amil: 5,
  };
  score += asnafWeights[asnaf] ?? 5;

  // Housing (max 15)
  const housingScores: Record<string, number> = {
    homeless: 15, rental: 10, family: 6, owned: 2,
  };
  score += housingScores[metrics.housing ?? "unknown"] ?? 5;

  return Math.round(score * 100) / 100;
}

function estimateAllocation(asnaf: string, metrics: TelegramPayload["metrics"]): number {
  const dependents = metrics.dependents ?? 1;
  // Base amount per asnaf type
  const baseAmounts: Record<string, number> = {
    fakir: 2500000, miskin: 2000000, gharimin: 1500000,
    ibnu_sabil: 1200000, mualaf: 1000000, fisabilillah: 800000,
    riqab: 800000, amil: 500000,
  };
  const base = baseAmounts[asnaf] ?? 1000000;
  return base + (dependents - 1) * 300000;
}

export async function POST(request: NextRequest) {
  try {
    const body: TelegramPayload = await request.json();

    // Validate required fields
    if (!body.nik || !body.full_name || !body.asnaf_category) {
      return NextResponse.json(
        { error: "Missing required fields: nik, full_name, asnaf_category" },
        { status: 400 }
      );
    }

    // Validate NIK format (16 digits)
    if (!/^\d{16}$/.test(body.nik)) {
      return NextResponse.json(
        { error: "NIK must be exactly 16 digits" },
        { status: 400 }
      );
    }

    const priorityScore = calculatePriorityScore(body.asnaf_category, body.metrics || {});
    const allocatedAmount = estimateAllocation(body.asnaf_category, body.metrics || {});

    const { data, error } = await supabase
      .from("mustahik_proposals")
      .insert({
        nik: body.nik,
        full_name: body.full_name,
        kecamatan_id: body.kecamatan_id || null,
        asnaf_category: body.asnaf_category,
        metrics: body.metrics || {},
        priority_score: priorityScore,
        allocated_amount: allocatedAmount,
        source: "TELEGRAM",
        status: "PENDING",
      })
      .select("id, priority_score, allocated_amount, status")
      .single();

    if (error) {
      // Duplicate NIK for active proposals
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Proposal aktif dengan NIK ini sudah ada" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log to audit
    await supabase.from("audit_ledger").insert({
      action: "PROPOSAL_SUBMITTED",
      entity_type: "mustahik_proposal",
      entity_id: data.id,
      payload: { source: "TELEGRAM", asnaf: body.asnaf_category },
    });

    return NextResponse.json({
      success: true,
      proposal: data,
      message: `Proposal diterima. Skor prioritas: ${priorityScore}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
