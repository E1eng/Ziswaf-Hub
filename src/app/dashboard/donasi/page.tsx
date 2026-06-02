import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInstitution } from "@/lib/institution";
import { formatRupiah } from "@/lib/utils/format";
import { fundLabel, FUND_TYPES, type FundType } from "@/lib/constants/ziswaf";
import { DonationForm } from "./donation-form";
import { ArrowDownToLine, Mail, AlertCircle } from "lucide-react";

interface PoolRow {
  fund_type: FundType;
  total_donated: number;
  total_disbursed: number;
  balance: number;
  disbursement_pct: number;
}

interface RecentDonation {
  id: string;
  donation_code: string;
  amount: number;
  fund_type: string;
  donor_name: string | null;
  donor_email: string | null;
  is_anonymous: boolean;
  channel: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  received_at: string | null;
}

async function getDonationPageData(institutionId: string) {
  const supabase = await createClient();

  const [{ data: poolData }, { data: recent }] = await Promise.all([
    supabase
      .from("fund_pool_view")
      .select("fund_type, total_donated, total_disbursed, balance, disbursement_pct")
      .eq("institution_id", institutionId),
    supabase
      .from("donations")
      .select("id, donation_code, amount, fund_type, donor_name, donor_email, is_anonymous, channel, email_sent_at, email_error, received_at")
      .eq("institution_id", institutionId)
      .order("received_at", { ascending: false })
      .limit(20),
  ]);

  // Build pool dict keyed by fund_type
  const pool: Record<FundType, PoolRow> = {
    zakat: zeroPool("zakat"),
    infaq: zeroPool("infaq"),
    sedekah: zeroPool("sedekah"),
    wakaf: zeroPool("wakaf"),
    dskl: zeroPool("dskl"),
  };
  for (const r of (poolData ?? []) as PoolRow[]) {
    if (r.fund_type && pool[r.fund_type as FundType]) {
      pool[r.fund_type as FundType] = {
        fund_type: r.fund_type as FundType,
        total_donated: Number(r.total_donated ?? 0),
        total_disbursed: Number(r.total_disbursed ?? 0),
        balance: Number(r.balance ?? 0),
        disbursement_pct: Number(r.disbursement_pct ?? 0),
      };
    }
  }

  return {
    pool,
    recentDonations: (recent ?? []) as RecentDonation[],
  };
}

function zeroPool(fund: FundType): PoolRow {
  return { fund_type: fund, total_donated: 0, total_disbursed: 0, balance: 0, disbursement_pct: 0 };
}

function formatDate(s: string | null): string {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DonasiPage() {
  const ctx = await getCurrentInstitution();

  if (!ctx) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Donasi Masuk" description="Catat donasi & kirim kode lacak ke muzakki" />
        <main className="flex-1 p-8">
          <Card className="max-w-lg border-amber-200">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Akun belum terhubung ke lembaga</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hubungi admin sistem untuk meng-assign akun Anda ke lembaga ZISWAF.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const data = await getDonationPageData(ctx.institutionId);

  // Total semua fund_type
  const totals = Object.values(data.pool).reduce(
    (acc, p) => ({
      donated: acc.donated + p.total_donated,
      disbursed: acc.disbursed + p.total_disbursed,
      balance: acc.balance + p.balance,
    }),
    { donated: 0, disbursed: 0, balance: 0 }
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Donasi Masuk"
        description={`Catat donasi & kirim kode lacak ke muzakki — ${ctx.institutionName}`}
      />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        {/* Pool summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Total Terkumpul</p>
              <p className="text-2xl font-bold mt-1">{formatRupiah(totals.donated)}</p>
              <p className="text-xs text-muted-foreground mt-1">Semua jenis dana</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Sudah Tersalur</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{formatRupiah(totals.disbursed)}</p>
              <p className="text-xs text-muted-foreground mt-1">Status batch DISBURSED/RECEIVED</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Saldo Pool</p>
              <p className="text-2xl font-bold mt-1">{formatRupiah(totals.balance)}</p>
              <p className="text-xs text-muted-foreground mt-1">Belum dialokasikan</p>
            </CardContent>
          </Card>
        </div>

        {/* Per fund_type pools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pool per Jenis Dana</CardTitle>
            <CardDescription>Saldo dan tingkat penyaluran per kantong dana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {FUND_TYPES.map((ft) => {
                const p = data.pool[ft];
                const pct = Math.min(100, Math.max(0, p.disbursement_pct));
                return (
                  <div key={ft} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{fundLabel(ft)}</span>
                    </div>
                    <p className="text-lg font-bold">{formatRupiah(p.total_donated)}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Tersalur {formatRupiah(p.total_disbursed)}
                    </p>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pct.toFixed(1)}% dialokasikan
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form + recent */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <DonationForm institutionId={ctx.institutionId} />
          </div>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDownToLine className="size-5" />
                Donasi Terbaru
              </CardTitle>
              <CardDescription>20 donasi terakhir lembaga Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentDonations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Belum ada donasi tercatat. Gunakan form di kiri untuk mencatat donasi pertama.
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="text-left py-2 px-2">Kode</th>
                        <th className="text-left py-2 px-2">Donor</th>
                        <th className="text-left py-2 px-2">Jenis</th>
                        <th className="text-right py-2 px-2">Jumlah</th>
                        <th className="text-center py-2 px-2">Email</th>
                        <th className="text-left py-2 px-2">Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentDonations.map((d) => (
                        <tr key={d.id} className="border-b last:border-0">
                          <td className="py-2 px-2 font-mono text-xs">{d.donation_code}</td>
                          <td className="py-2 px-2">
                            {d.is_anonymous ? (
                              <span className="text-muted-foreground italic">Anonim</span>
                            ) : (
                              d.donor_name ?? <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <Badge variant="outline" className="text-xs">{fundLabel(d.fund_type)}</Badge>
                          </td>
                          <td className="py-2 px-2 text-right font-medium">{formatRupiah(d.amount)}</td>
                          <td className="py-2 px-2 text-center">
                            {!d.donor_email ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : d.email_sent_at ? (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Mail className="size-3" /> Terkirim
                              </Badge>
                            ) : d.email_error ? (
                              <Badge variant="destructive" className="text-xs">Gagal</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Pending</Badge>
                            )}
                          </td>
                          <td className="py-2 px-2 text-xs text-muted-foreground">
                            {formatDate(d.received_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
