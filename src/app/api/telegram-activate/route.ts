import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Telegram bot activation endpoint.
 *
 * Dipanggil oleh bot worker eksternal saat user kirim `/start <invite_code>`.
 * Bot worker bertanggung jawab terima webhook Telegram, parse command,
 * lalu POST ke endpoint ini untuk bind chat_id ke field_worker.
 *
 * Body:
 *   {
 *     invite_code: string,         // FW-XXXXXX dari supervisor
 *     telegram_chat_id: number,    // dari Telegram update
 *     telegram_username?: string   // opsional
 *   }
 *
 * Response:
 *   { success: true, field_worker: { id, full_name, institution_name } }
 *   atau
 *   { error: "..." }, status 400/403/404/410
 *
 * Endpoint pakai SERVICE_ROLE — auth-nya berbasis invite_code yang punya
 * partial unique index + expiry check.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface ActivatePayload {
  invite_code?: string;
  telegram_chat_id?: number;
  telegram_username?: string;
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server configuration incomplete" },
      { status: 500 }
    );
  }

  let body: ActivatePayload;
  try {
    body = (await request.json()) as ActivatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inviteCode = body.invite_code?.trim();
  const chatId = body.telegram_chat_id;
  const username = body.telegram_username?.trim() || null;

  if (!inviteCode || typeof chatId !== "number") {
    return NextResponse.json(
      { error: "Missing invite_code or telegram_chat_id" },
      { status: 400 }
    );
  }

  if (!/^FW-[A-F0-9]{6}$/i.test(inviteCode)) {
    return NextResponse.json(
      { error: "Format invite code tidak valid (harus FW-XXXXXX)" },
      { status: 400 }
    );
  }

  const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1. Find pending invite
  const { data: fw, error: lookupErr } = await supabase
    .from("field_workers")
    .select("id, institution_id, full_name, invite_expires_at, status")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  }
  if (!fw) {
    return NextResponse.json(
      { error: "Invite code tidak ditemukan. Hubungi supervisor lembaga Anda untuk kode baru." },
      { status: 404 }
    );
  }
  if (fw.status === "active") {
    return NextResponse.json(
      { error: "Invite ini sudah pernah digunakan. Hubungi supervisor untuk regenerate kode." },
      { status: 409 }
    );
  }
  if (fw.status === "revoked") {
    return NextResponse.json(
      { error: "Akses Anda telah dicabut oleh supervisor lembaga." },
      { status: 403 }
    );
  }
  if (fw.invite_expires_at && new Date(fw.invite_expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Invite code sudah kadaluarsa. Hubungi supervisor untuk kode baru." },
      { status: 410 }
    );
  }

  // 2. Check chat_id belum dipakai (anti-link-hopping)
  const { data: existing } = await supabase
    .from("field_workers")
    .select("id, full_name")
    .eq("telegram_chat_id", chatId)
    .eq("status", "active")
    .maybeSingle();

  if (existing && existing.id !== fw.id) {
    return NextResponse.json(
      {
        error: `Akun Telegram ini sudah terhubung sebagai field worker lain (${existing.full_name}). Tidak bisa double-bind.`,
      },
      { status: 409 }
    );
  }

  // 3. Activate
  const { error: updateErr } = await supabase
    .from("field_workers")
    .update({
      telegram_chat_id: chatId,
      telegram_username: username,
      status: "active",
      activated_at: new Date().toISOString(),
      // Clear invite_code agar tidak bisa di-reuse
      invite_code: null,
      invite_expires_at: null,
    })
    .eq("id", fw.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // 4. Get institution name for response
  const { data: inst } = await supabase
    .from("institutions")
    .select("name")
    .eq("id", fw.institution_id)
    .single();

  // 5. Audit
  await supabase.from("audit_ledger").insert({
    action: "FIELD_WORKER_ACTIVATED",
    entity_type: "field_worker",
    entity_id: fw.id,
    institution_id: fw.institution_id,
    payload: {
      full_name: fw.full_name,
      telegram_chat_id: chatId,
      telegram_username: username,
    },
  });

  return NextResponse.json({
    success: true,
    field_worker: {
      id: fw.id,
      full_name: fw.full_name,
      institution_name: inst?.name ?? "Lembaga ZISWAF",
    },
    message: `Selamat datang, ${fw.full_name}! Akun Telegram Anda terhubung dengan ${inst?.name ?? "lembaga"}.`,
  });
}
