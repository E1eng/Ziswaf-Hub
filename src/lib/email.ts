/**
 * Email service — Resend integration.
 *
 * Configuration:
 *   - RESEND_API_KEY (server-only) — dapat dari resend.com dashboard
 *   - RESEND_FROM_EMAIL (default: "ZISWAF Hub <noreply@ziswafhub.id>")
 *
 * Behavior:
 *   - Kalau API key tidak ada (mode dev/demo), email dilog ke console saja.
 *   - Network errors di-swallow, function selalu return result object.
 *   - Tidak throw — caller tinggal cek `result.success`.
 */

import { formatRupiah } from "@/lib/utils/format";
import { fundLabel } from "@/lib/constants/ziswaf";

interface SendDonationEmailInput {
  to: string;
  donorName: string;
  donationCode: string;
  amount: number;
  fundType: string;
  institutionName: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "ZISWAF Hub <noreply@ziswafhub.id>";
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendDonationEmail(input: SendDonationEmailInput): Promise<EmailResult> {
  const subject = `Terima kasih atas donasi Anda — Kode: ${input.donationCode}`;
  const trackingUrl = `${APP_BASE_URL}/lacak?kode=${encodeURIComponent(input.donationCode)}`;
  const html = renderDonationEmailHtml({ ...input, trackingUrl });
  const text = renderDonationEmailText({ ...input, trackingUrl });

  // Dev/demo mode: log saja
  if (!RESEND_API_KEY) {
    console.log("[email:dev]", {
      to: input.to,
      subject,
      donationCode: input.donationCode,
      trackingUrl,
    });
    return { success: true, messageId: "dev-no-resend-key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [input.to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `Resend API ${res.status}: ${errBody}` };
    }

    const data = await res.json() as { id?: string };
    return { success: true, messageId: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

interface EmailRenderInput extends SendDonationEmailInput {
  trackingUrl: string;
}

function renderDonationEmailText(i: EmailRenderInput): string {
  return `
Assalamu'alaikum ${i.donorName},

Terima kasih atas donasi Anda kepada ${i.institutionName}.

Detail Donasi:
- Kode Lacak: ${i.donationCode}
- Jumlah: ${formatRupiah(i.amount)}
- Jenis Dana: ${fundLabel(i.fundType)}

Anda dapat melacak status penyaluran dana Anda kapan saja di:
${i.trackingUrl}

Simpan kode di atas untuk referensi. Kode ini bersifat anonim — siapa saja
yang memilikinya dapat melihat status pool dana, namun data pribadi tidak
akan ditampilkan sesuai UU Perlindungan Data Pribadi.

Jazakumullahu khairan,
Tim ${i.institutionName}
via ZISWAF Hub
  `.trim();
}

function renderDonationEmailHtml(i: EmailRenderInput): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#f9fafb; margin:0; padding:24px; color:#111827; }
  .card { max-width:560px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; border:1px solid #e5e7eb; }
  .header { background:linear-gradient(135deg,#10b981,#059669); color:white; padding:32px 28px; text-align:center; }
  .header h1 { margin:0 0 8px; font-size:24px; font-weight:700; }
  .header p { margin:0; opacity:0.95; font-size:14px; }
  .content { padding:28px; }
  .greeting { font-size:16px; line-height:1.6; }
  .detail { background:#f3f4f6; border-radius:12px; padding:20px; margin:20px 0; }
  .detail-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
  .detail-row strong { color:#374151; }
  .code-box { background:#ecfdf5; border:2px dashed #10b981; border-radius:12px; padding:20px; text-align:center; margin:20px 0; }
  .code-box .label { font-size:12px; color:#065f46; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; }
  .code-box .code { font-family:"Courier New",monospace; font-size:22px; font-weight:700; color:#065f46; letter-spacing:0.1em; }
  .cta { text-align:center; margin:24px 0; }
  .cta a { display:inline-block; background:#10b981; color:white; text-decoration:none; padding:12px 28px; border-radius:10px; font-weight:600; font-size:14px; }
  .footer { padding:20px 28px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; line-height:1.5; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Donasi Anda Telah Diterima</h1>
      <p>${i.institutionName}</p>
    </div>
    <div class="content">
      <p class="greeting">Assalamu'alaikum <strong>${escapeHtml(i.donorName)}</strong>,</p>
      <p class="greeting">Terima kasih atas donasi Anda. Berikut bukti penerimaan dana Anda.</p>

      <div class="detail">
        <div class="detail-row"><span>Jumlah Donasi</span><strong>${formatRupiah(i.amount)}</strong></div>
        <div class="detail-row"><span>Jenis Dana</span><strong>${fundLabel(i.fundType)}</strong></div>
        <div class="detail-row"><span>Lembaga</span><strong>${escapeHtml(i.institutionName)}</strong></div>
      </div>

      <div class="code-box">
        <div class="label">Kode Lacak Anda</div>
        <div class="code">${i.donationCode}</div>
      </div>

      <div class="cta">
        <a href="${i.trackingUrl}">Lacak Penyaluran Donasi Saya</a>
      </div>

      <p class="greeting" style="font-size:14px; color:#6b7280; margin-top:24px;">
        Simpan kode di atas untuk pelacakan kapan saja. Kode bersifat anonim sesuai UU Perlindungan Data Pribadi —
        Anda dapat melihat status pool dana lembaga, namun data pribadi penerima manfaat tidak ditampilkan.
      </p>
    </div>
    <div class="footer">
      Email ini dikirim otomatis oleh ZISWAF Hub atas nama ${escapeHtml(i.institutionName)}.<br/>
      Jika Anda tidak melakukan donasi ini, silakan abaikan pesan ini.
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
