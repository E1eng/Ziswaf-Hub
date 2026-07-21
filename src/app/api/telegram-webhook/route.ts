import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { estimateAssistanceAmount } from "@/lib/estimate";

/**
 * Telegram webhook — submit assessment dari field worker via bot @ziswafhub_bot.
 *
 * Flow:
 *   1. Identify field_worker via telegram_chat_id (sudah di-onboard via /start <invite>)
 *   2. Resolve institution_id dari field_worker
 *   3. Find or create mustahik_registry by NIK
 *   4. Create mustahik_assessments (status=PENDING, source=TELEGRAM)
 *   5. priority_score auto-dihitung oleh trigger DB
 *   6. Write audit_ledger
 *
 * Schema body:
 *   {
 *     telegram_chat_id: number,        // identitas field worker
 *     nik: string,                     // 16 digit
 *     full_name: string,
 *     asnaf_category: 'fakir'|...,
 *     metrics: { monthly_income, dependents, housing },
 *     kecamatan_id?: string            // opsional
 *   }
 *
 * Endpoint ini pakai SERVICE_ROLE supaya bisa bypass RLS — auth-nya berdasarkan
 * telegram_chat_id yang sudah terdaftar di tabel `field_workers`.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  // Don't crash module load; return error at request time instead
  console.warn("[telegram-webhook] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
}

interface TelegramPayload {
  telegram_chat_id?: number;
  nik?: string;
  full_name?: string;
  kecamatan_id?: string;
  asnaf_category?: string;
  metrics?: {
    monthly_income?: number;
    dependents?: number;
    housing?: string;
    is_orphan?: boolean;
  };
}

const VALID_ASNAF = new Set([
  "fakir", "miskin", "amil", "mualaf",
  "riqab", "gharimin", "fisabilillah", "ibnu_sabil",
]);

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server configuration incomplete" },
      { status: 500 }
    );
  }

  let body: TelegramPayload;
  try {
    body = (await request.json()) as TelegramPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.telegram_chat_id || !body.nik || !body.full_name || !body.asnaf_category) {
    return NextResponse.json(
      { error: "Missing required fields: telegram_chat_id, nik, full_name, asnaf_category" },
      { status: 400 }
    );
  }
  if (!/^\d{16}$/.test(body.nik)) {
    return NextResponse.json({ error: "NIK must be exactly 16 digits" }, { status: 400 });
  }
  if (!VALID_ASNAF.has(body.asnaf_category)) {
    return NextResponse.json(
      { error: `Invalid asnaf_category. Must be one of: ${[...VALID_ASNAF].join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1. Identify field worker
  const { data: fw, error: fwErr } = await supabase
    .from("field_workers")
    .select("id, institution_id, full_name, status")
    .eq("telegram_chat_id", body.telegram_chat_id)
    .eq("status", "active")
    .maybeSingle();

  if (fwErr || !fw) {
    return NextResponse.json(
      { error: "Field worker tidak terdaftar atau tidak aktif. Hubungi supervisor lembaga Anda." },
      { status: 403 }
    );
  }

  // 2. Find or create mustahik_registry
  const { data: existingMustahik } = await supabase
    .from("mustahik_registry")
    .select("id")
    .eq("nik", body.nik)
    .maybeSingle();

  let mustahikId: string;
  if (existingMustahik) {
    mustahikId = existingMustahik.id;
  } else {
    const { data: newMustahik, error: mErr } = await supabase
      .from("mustahik_registry")
      .insert({
        nik: body.nik,
        full_name: body.full_name,
        kecamatan_id: body.kecamatan_id ?? null,
        first_registered_by_institution_id: fw.institution_id,
      })
      .select("id")
      .single();

    if (mErr || !newMustahik) {
      return NextResponse.json(
        { error: mErr?.message ?? "Gagal mendaftarkan mustahik" },
        { status: 500 }
      );
    }
    mustahikId = newMustahik.id;
  }

  // 3. Create assessment (one active per institution per mustahik — enforced by partial index)
  const metrics = body.metrics ?? {};
  const estimatedAmount = estimateAssistanceAmount({
    asnaf: body.asnaf_category,
    monthlyIncome: metrics.monthly_income ?? 0,
    dependents: metrics.dependents ?? 1,
    housing: metrics.housing ?? "unknown",
    isOrphan: metrics.is_orphan ?? false,
  });

  const { data: assess, error: aErr } = await supabase
    .from("mustahik_assessments")
    .insert({
      mustahik_id: mustahikId,
      institution_id: fw.institution_id,
      asnaf_category: body.asnaf_category,
      metrics,
      estimated_amount: estimatedAmount,
      source: "TELEGRAM",
      status: "PENDING",
      field_worker_id: fw.id,
    })
    .select("id, priority_score, estimated_amount, status")
    .single();

  if (aErr || !assess) {
    if (aErr?.code === "23505") {
      return NextResponse.json(
        { error: "Mustahik ini sudah memiliki assessment aktif di lembaga Anda" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: aErr?.message ?? "Gagal membuat assessment" },
      { status: 500 }
    );
  }

  // 4. Update field_worker.last_active_at
  await supabase
    .from("field_workers")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", fw.id);

  // 5. Audit log
  await supabase.from("audit_ledger").insert({
    action: "ASSESSMENT_SUBMITTED",
    entity_type: "mustahik_assessment",
    entity_id: assess.id,
    institution_id: fw.institution_id,
    payload: {
      source: "TELEGRAM",
      asnaf: body.asnaf_category,
      field_worker_id: fw.id,
      mustahik_id: mustahikId,
    },
  });

  return NextResponse.json({
    success: true,
    assessment: {
      id: assess.id,
      priority_score: assess.priority_score,
      estimated_amount: assess.estimated_amount,
      status: assess.status,
    },
    message: `Proposal diterima. Skor prioritas: ${assess.priority_score}`,
  });
}
