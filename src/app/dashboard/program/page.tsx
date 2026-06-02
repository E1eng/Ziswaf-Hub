import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ClipboardList, Plus, Calendar, Target, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInstitution } from "@/lib/institution";
import { formatRupiah } from "@/lib/utils/format";
import {
  fundLabel,
  PROGRAM_STATUS,
  PROGRAM_TYPE,
  ASSISTANCE_TYPE_LABELS,
  type ProgramStatus,
  type ProgramType,
  type AssistanceType,
  asnafLabel,
} from "@/lib/constants/ziswaf";

interface ProgramRow {
  id: string;
  name: string;
  fund_type: string;
  assistance_type: string;
  target_asnaf: string[];
  budget: number;
  period_start: string;
  period_end: string;
  beneficiary_target: number | null;
  program_type: string;
  status: string;
  created_at: string | null;
}

interface ProgramWithStats extends ProgramRow {
  allocated: number;
  beneficiary_count: number;
  batch_count: number;
}

async function getPrograms(institutionId: string): Promise<ProgramWithStats[]> {
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, fund_type, assistance_type, target_asnaf, budget, period_start, period_end, beneficiary_target, program_type, status, created_at")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: false });

  if (!programs || programs.length === 0) return [];

  const programIds = programs.map((p) => p.id);

  // Fetch batch stats per program
  const { data: batches } = await supabase
    .from("disbursement_batches")
    .select("program_id, total_amount, beneficiary_count")
    .in("program_id", programIds);

  const statsMap = new Map<string, { allocated: number; beneficiary: number; count: number }>();
  for (const b of batches ?? []) {
    if (!b.program_id) continue;
    const cur = statsMap.get(b.program_id) ?? { allocated: 0, beneficiary: 0, count: 0 };
    cur.allocated += Number(b.total_amount ?? 0);
    cur.beneficiary += b.beneficiary_count ?? 0;
    cur.count += 1;
    statsMap.set(b.program_id, cur);
  }

  return programs.map((p) => {
    const stats = statsMap.get(p.id) ?? { allocated: 0, beneficiary: 0, count: 0 };
    return {
      ...(p as ProgramRow),
      allocated: stats.allocated,
      beneficiary_count: stats.beneficiary,
      batch_count: stats.count,
    };
  });
}

function formatDateRange(start: string, end: string): string {
  const fmt = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default async function ProgramListPage() {
  const ctx = await getCurrentInstitution();

  if (!ctx) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Program Penyaluran" description="Kelola program multi-fund + alokasi" />
        <main className="flex-1 p-8">
          <Card className="max-w-lg border-amber-200">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Akun belum terhubung ke lembaga</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hubungi admin untuk meng-assign akun Anda ke salah satu lembaga.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const programs = await getPrograms(ctx.institutionId);
  const active = programs.filter((p) => p.status === "ACTIVE").length;
  const draft = programs.filter((p) => p.status === "DRAFT").length;
  const completed = programs.filter((p) => p.status === "COMPLETED").length;
  const totalBudget = programs.reduce((s, p) => s + Number(p.budget ?? 0), 0);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Program Penyaluran"
        description={`Kelola program multi-fund — ${ctx.institutionName}`}
      >
        <Link href="/dashboard/program/baru" className={buttonVariants()}>
          <Plus className="size-4 mr-2" />
          Buat Program
        </Link>
      </PageHeader>

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Program</p>
            <p className="text-2xl font-bold mt-1">{programs.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Aktif</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{active}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Draft</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{draft}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Selesai</p>
            <p className="text-2xl font-bold mt-1">{completed}</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anggaran Program</CardTitle>
            <CardDescription>Total budget semua program di {ctx.institutionName}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatRupiah(totalBudget)}</p>
          </CardContent>
        </Card>

        {/* List */}
        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardList className="size-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold">Belum ada program</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Buat program pertama untuk mulai mengalokasikan dana ke mustahik dengan greedy knapsack.
              </p>
              <Link href="/dashboard/program/baru" className={buttonVariants({ className: "mt-4" })}>
                <Plus className="size-4 mr-2" />
                Buat Program Pertama
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {programs.map((p) => {
              const cfgType = PROGRAM_TYPE[p.program_type as ProgramType] ?? PROGRAM_TYPE.RUTIN;
              const cfgStatus = PROGRAM_STATUS[p.status as ProgramStatus] ?? PROGRAM_STATUS.DRAFT;
              const allocPct = p.budget > 0 ? (p.allocated / p.budget) * 100 : 0;
              return (
                <Link key={p.id} href={`/dashboard/program/${p.id}`} className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl text-white ${cfgType.color} shrink-0`}>
                          <ClipboardList className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base truncate">{p.name}</h3>
                            <Badge variant={cfgStatus.variant}>{cfgStatus.label}</Badge>
                            <Badge variant="outline" className="text-xs">{fundLabel(p.fund_type)}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {ASSISTANCE_TYPE_LABELS[p.assistance_type as AssistanceType] ?? p.assistance_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              {formatDateRange(p.period_start, p.period_end)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="size-3.5" />
                              {p.target_asnaf.map(asnafLabel).join(", ")}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-3 max-w-2xl">
                            <div>
                              <p className="text-xs text-muted-foreground">Anggaran</p>
                              <p className="font-semibold">{formatRupiah(p.budget)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Teralokasi</p>
                              <p className="font-semibold text-emerald-600">{formatRupiah(p.allocated)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Penerima</p>
                              <p className="font-semibold">
                                {p.beneficiary_count}
                                {p.beneficiary_target ? `/${p.beneficiary_target}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-3 max-w-2xl">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${Math.min(100, allocPct)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
