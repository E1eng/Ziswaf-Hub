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
  FileText,
  Calculator,
  CheckCircle,
  Clock,
  Send,
  Users,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber } from "@/lib/utils/format";
import { PROPOSAL_STATUS } from "@/lib/constants/ziswaf";

async function getDashboardData() {
  const supabase = await createClient();

  const [
    { data: proposals },
    { data: batches },
    { data: recentProposals },
    { data: recentBatches },
  ] = await Promise.all([
    supabase.from("mustahik_proposals").select("status, allocated_amount"),
    supabase.from("disbursement_batches").select("total_amount, beneficiary_count"),
    supabase
      .from("mustahik_proposals")
      .select("id, full_name, asnaf_category, status, priority_score, allocated_amount, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase
      .from("disbursement_batches")
      .select("batch_code, total_amount, beneficiary_count, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const all = proposals || [];
  const pending = all.filter((p) => p.status === "PENDING").length;
  const approved = all.filter((p) => p.status === "APPROVED").length;
  const disbursed = all.filter((p) => p.status === "DISBURSED").length;
  const total = all.length;

  const totalDisbursed = (batches || []).reduce((s, b) => s + (b.total_amount || 0), 0);
  const totalBeneficiaries = (batches || []).reduce((s, b) => s + (b.beneficiary_count || 0), 0);
  const totalBatches = (batches || []).length;

  return {
    pending,
    approved,
    disbursed,
    total,
    totalDisbursed,
    totalBeneficiaries,
    totalBatches,
    recentProposals: recentProposals || [],
    recentBatches: recentBatches || [],
  };
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Beranda"
        description="Ringkasan aktivitas lembaga Anda"
      />

      <main className="flex-1 p-8 space-y-8">
        {d.total === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="size-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Selamat Datang di ZISWAF Hub</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Belum ada data proposal. Ikuti langkah berikut untuk memulai:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  href="/dashboard/proposal"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <span className="bg-primary-foreground/20 rounded-full size-6 flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  Ajukan Proposal
                </Link>
                <ArrowRight className="size-4 text-muted-foreground hidden sm:block" />
                <span className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-muted-foreground">
                  <span className="bg-muted-foreground/20 rounded-full size-6 flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  Review & Setujui
                </span>
                <ArrowRight className="size-4 text-muted-foreground hidden sm:block" />
                <span className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-muted-foreground">
                  <span className="bg-muted-foreground/20 rounded-full size-6 flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  Alokasi Cerdas
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Total Proposal</CardTitle>
              <FileText className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{d.total}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {d.pending} menunggu &middot; {d.approved} disetujui
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Menunggu Review</CardTitle>
              <Clock className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{d.pending}</div>
              <p className="text-sm text-muted-foreground mt-2">Proposal perlu ditinjau</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Sudah Disalurkan</CardTitle>
              <CheckCircle className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatRupiah(d.totalDisbursed)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {formatNumber(d.totalBeneficiaries)} penerima &middot; {d.totalBatches} batch
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Siap Disalurkan</CardTitle>
              <Send className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{d.approved}</div>
              <p className="text-sm text-muted-foreground mt-2">Proposal disetujui, belum disalurkan</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Yang Bisa Anda Lakukan</CardTitle>
            <CardDescription className="text-sm">Pilih menu di bawah untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/dashboard/proposal"
              className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="p-3 bg-primary/10 rounded-xl">
                <FileText className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold group-hover:text-primary">E-Proposal</p>
                <p className="text-sm text-muted-foreground">Kelola pengajuan mustahik</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard/alokasi"
              className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Calculator className="size-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold group-hover:text-green-600">Alokasi Cerdas</p>
                <p className="text-sm text-muted-foreground">Seleksi & salurkan ke penerima</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/lacak"
              className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Users className="size-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold group-hover:text-amber-600">Lacak Penyaluran</p>
                <p className="text-sm text-muted-foreground">Cek status batch penyaluran</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Data */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Recent Proposals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Proposal Terbaru</CardTitle>
                <Link href="/dashboard/proposal" className="text-xs text-primary hover:underline">
                  Lihat Semua
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {d.recentProposals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Belum ada proposal</p>
              ) : (
                <div className="space-y-2">
                  {d.recentProposals.map((p) => {
                    const st = PROPOSAL_STATUS[p.status as keyof typeof PROPOSAL_STATUS];
                    return (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {p.asnaf_category} &middot; Skor {p.priority_score}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatRupiah(p.allocated_amount || 0)}</span>
                          <Badge variant={st?.variant ?? "outline"} className="text-xs">
                            {st?.label ?? p.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Batches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Penyaluran Terbaru</CardTitle>
                <Link href="/lacak" className="text-xs text-primary hover:underline">
                  Lacak
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {d.recentBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Belum ada penyaluran</p>
              ) : (
                <div className="space-y-2">
                  {d.recentBatches.map((b) => (
                    <div key={b.batch_code} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium font-mono">{b.batch_code}</p>
                        <p className="text-xs text-muted-foreground">{b.beneficiary_count} penerima</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatRupiah(b.total_amount || 0)}</p>
                        <Badge variant="default" className="text-xs">
                          {b.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
