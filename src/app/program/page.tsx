import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils/format";
import {
  fundLabel,
  ASSISTANCE_TYPE_LABELS,
  asnafLabel,
  type AssistanceType,
} from "@/lib/constants/ziswaf";
import { ArrowLeft, ClipboardList, Calendar, Target, Building2 } from "lucide-react";

interface ProgramRow {
  id: string;
  name: string;
  description: string | null;
  fund_type: string;
  assistance_type: string;
  target_asnaf: string[];
  budget: number;
  period_start: string;
  period_end: string;
  beneficiary_target: number | null;
  institution: { id: string; name: string } | null;
}

async function getActivePrograms(): Promise<ProgramRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("programs")
    .select(`
      id, name, description, fund_type, assistance_type, target_asnaf,
      budget, period_start, period_end, beneficiary_target,
      institution:institutions!inner(id, name)
    `)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(100);

  type Raw = Omit<ProgramRow, "institution"> & {
    institution: { id: string; name: string };
  };

  return ((data ?? []) as unknown as Raw[]).map((p) => ({
    ...p,
    institution: p.institution,
  }));
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProgramListPage() {
  const programs = await getActivePrograms();
  const totalBudget = programs.reduce((s, p) => s + Number(p.budget ?? 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50/30 to-white">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
            <ArrowLeft className="size-5" />
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-base font-bold">Z</span>
            </div>
            ZISWAF Hub
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/lembaga" className="text-muted-foreground hover:text-foreground">Direktori Lembaga</Link>
            <Link href="/program" className="font-medium">Program Aktif</Link>
            <Link href="/lacak" className="text-muted-foreground hover:text-foreground">Lacak</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-10 space-y-8 max-w-6xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Program ZISWAF Aktif</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Program penyaluran yang sedang berjalan di lembaga-lembaga ZISWAF
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Program Aktif</p>
            <p className="text-2xl font-bold mt-1">{programs.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Anggaran</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(totalBudget)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Lembaga Berpartisipasi</p>
            <p className="text-2xl font-bold mt-1">
              {new Set(programs.map((p) => p.institution?.id).filter(Boolean)).size}
            </p>
          </CardContent></Card>
        </div>

        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardList className="size-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Belum ada program aktif saat ini</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {programs.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                      <ClipboardList className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight">{p.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{fundLabel(p.fund_type)}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {ASSISTANCE_TYPE_LABELS[p.assistance_type as AssistanceType] ?? p.assistance_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {p.description && (
                    <p className="text-muted-foreground line-clamp-2">{p.description}</p>
                  )}

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 shrink-0" />
                      <span className="truncate">{p.institution?.name ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 shrink-0" />
                      <span>{fmtDate(p.period_start)} – {fmtDate(p.period_end)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Target className="size-3.5 shrink-0 mt-0.5" />
                      <span>{p.target_asnaf.map(asnafLabel).join(", ")}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Anggaran</p>
                      <p className="font-bold">{formatRupiah(p.budget)}</p>
                    </div>
                    {p.beneficiary_target ? (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="font-bold">{p.beneficiary_target} orang</p>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
