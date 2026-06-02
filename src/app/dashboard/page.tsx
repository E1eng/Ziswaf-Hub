import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  ArrowRight,
  HandCoins,
  Calculator,
  CheckCircle,
  Wallet,
  Users,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInstitution } from "@/lib/institution";
import { formatRupiah, formatNumber } from "@/lib/utils/format";
import { fundLabel, FUND_TYPES, type FundType } from "@/lib/constants/ziswaf";

async function getDashboardData(institutionId: string) {
  const supabase = await createClient();

  const [
    { data: assessments },
    { data: batches },
    { data: pool },
    { data: programs },
    { data: recentDonations },
  ] = await Promise.all([
    supabase
      .from("mustahik_assessments")
      .select("status")
      .eq("institution_id", institutionId),
    supabase
      .from("disbursement_batches")
      .select("total_amount, beneficiary_count, status")
      .eq("institution_id", institutionId),
    supabase
      .from("fund_pool_view")
      .select("fund_type, total_donated, total_disbursed, balance")
      .eq("institution_id", institutionId),
    supabase
      .from("programs")
      .select("id, status")
      .eq("institution_id", institutionId),
    supabase
      .from("donations")
      .select("id, donation_code, donor_name, is_anonymous, amount, fund_type, received_at")
      .eq("institution_id", institutionId)
      .order("received_at", { ascending: false })
      .limit(5),
  ]);

  const aRows = assessments ?? [];
  const pendingAssess = aRows.filter((a) => a.status === "PENDING").length;
  const approvedAssess = aRows.filter((a) => a.status === "APPROVED").length;
  const totalAssess = aRows.length;

  const totalDonated = (pool ?? []).reduce((s, p) => s + Number(p.total_donated ?? 0), 0);
  const totalDisbursed = (pool ?? []).reduce((s, p) => s + Number(p.total_disbursed ?? 0), 0);

  const bRows = batches ?? [];
  const totalBatches = bRows.length;
  const totalBeneficiaries = bRows.reduce((s, b) => s + (b.beneficiary_count ?? 0), 0);

  const pRows = programs ?? [];
  const activePrograms = pRows.filter((p) => p.status === "ACTIVE").length;
  const totalPrograms = pRows.length;

  // Pool per fund_type
  const poolByFund: Record<FundType, { donated: number; disbursed: number; balance: number }> = {
    zakat: { donated: 0, disbursed: 0, balance: 0 },
    infaq: { donated: 0, disbursed: 0, balance: 0 },
    sedekah: { donated: 0, disbursed: 0, balance: 0 },
    wakaf: { donated: 0, disbursed: 0, balance: 0 },
    dskl: { donated: 0, disbursed: 0, balance: 0 },
  };
  for (const r of pool ?? []) {
    if (r.fund_type && poolByFund[r.fund_type as FundType]) {
      poolByFund[r.fund_type as FundType] = {
        donated: Number(r.total_donated ?? 0),
        disbursed: Number(r.total_disbursed ?? 0),
        balance: Number(r.balance ?? 0),
      };
    }
  }

  return {
    pendingAssess,
    approvedAssess,
    totalAssess,
    totalDonated,
    totalDisbursed,
    totalBatches,
    totalBeneficiaries,
    activePrograms,
    totalPrograms,
    poolByFund,
    recentDonations: recentDonations ?? [],
  };
}

export default async function DashboardPage() {
  const ctx = await getCurrentInstitution();

  if (!ctx) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Beranda" description="Ringkasan aktivitas lembaga Anda" />
        <main className="flex-1 p-8">
          <Card className="max-w-lg border-amber-200">
            <CardContent className="pt-6">
              <p className="font-semibold">Akun belum terhubung ke lembaga</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hubungi admin sistem untuk meng-assign akun Anda ke salah satu lembaga ZISWAF.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const d = await getDashboardData(ctx.institutionId);
  const empty = d.totalDonated === 0 && d.totalAssess === 0;

  return (
    <div className="flex flex-col">
      <PageHeader title="Beranda" description={`Ringkasan ${ctx.institutionName}`} />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        {empty && (
          <Card className="border-dashed border-2">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <HandCoins className="size-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Selamat Datang di ZISWAF Hub</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Mulai dengan mencatat donasi masuk, lalu buat program penyaluran.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/dashboard/donasi"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                >
                  <HandCoins className="size-4" /> Catat Donasi
                </Link>
                <Link
                  href="/dashboard/program"
                  className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg font-medium hover:bg-muted"
                >
                  <ClipboardList className="size-4" /> Buat Program
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donasi Masuk</CardTitle>
              <HandCoins className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(d.totalDonated)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Semua jenis dana
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sudah Tersalur</CardTitle>
              <CheckCircle className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatRupiah(d.totalDisbursed)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(d.totalBeneficiaries)} penerima · {d.totalBatches} batch
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assessment</CardTitle>
              <Users className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{d.totalAssess}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {d.pendingAssess} menunggu · {d.approvedAssess} disetujui
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Program Aktif</CardTitle>
              <ClipboardList className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{d.activePrograms}</div>
              <p className="text-xs text-muted-foreground mt-1">dari {d.totalPrograms} total program</p>
            </CardContent>
          </Card>
        </div>

        {/* Pool summary per fund_type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pool Dana per Jenis</CardTitle>
            <CardDescription>Saldo dan tingkat penyaluran tiap kantong dana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {FUND_TYPES.map((ft) => {
                const p = d.poolByFund[ft];
                const pct = p.donated > 0 ? (p.disbursed / p.donated) * 100 : 0;
                return (
                  <div key={ft} className="border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{fundLabel(ft)}</span>
                    </div>
                    <p className="text-base font-bold">{formatRupiah(p.donated)}</p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {formatRupiah(p.balance)}
                    </p>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <QuickAction
              href="/dashboard/donasi"
              icon={HandCoins}
              title="Catat Donasi"
              desc="Input donasi masuk + auto-email kode"
            />
            <QuickAction
              href="/dashboard/program"
              icon={ClipboardList}
              title="Kelola Program"
              desc="Buat program & alokasikan dana"
            />
            <QuickAction
              href="/dashboard/alokasi"
              icon={Calculator}
              title="Alokasi Cerdas"
              desc="Wizard knapsack ke mustahik"
            />
          </CardContent>
        </Card>

        {/* Recent donations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Donasi Terbaru</CardTitle>
              <Link href="/dashboard/donasi" className="text-xs text-primary hover:underline">
                Lihat semua →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {d.recentDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Belum ada donasi tercatat
              </p>
            ) : (
              <div className="divide-y">
                {d.recentDonations.map((don) => (
                  <div key={don.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">{don.donation_code}</code>
                        <Badge variant="outline" className="text-xs">{fundLabel(don.fund_type)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {don.is_anonymous ? "Anonim" : don.donor_name ?? "—"}
                      </p>
                    </div>
                    <p className="font-medium">{formatRupiah(don.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof HandCoins;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/40 transition-colors group"
    >
      <div className="p-3 bg-primary/10 rounded-xl">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold group-hover:text-primary">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}
