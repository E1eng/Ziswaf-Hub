import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Target,
  AlertCircle,
  Calculator,
  Wallet,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInstitution } from "@/lib/institution";
import { formatRupiah } from "@/lib/utils/format";
import {
  fundLabel,
  PROGRAM_STATUS,
  PROGRAM_TYPE,
  ASSISTANCE_TYPE_LABELS,
  asnafLabel,
  BATCH_STATUS,
  type ProgramStatus,
  type ProgramType,
  type AssistanceType,
  type BatchStatus,
} from "@/lib/constants/ziswaf";
import { fetchAllocationCandidates } from "@/lib/allocation";
import { ProgramActions } from "./program-actions";
import { AllocationWizard } from "./allocation-wizard";

function fmtDate(s: string | null): string {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(s: string | null): string {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await getCurrentInstitution();

  if (!ctx) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .single();

  if (!program) notFound();
  if (program.institution_id !== ctx.institutionId) {
    // Other institution's program — show read-only
  }

  // Fetch batches for this program
  const { data: batches } = await supabase
    .from("disbursement_batches")
    .select("id, batch_code, total_amount, beneficiary_count, status, created_at, disbursed_at")
    .eq("program_id", id)
    .order("created_at", { ascending: false });

  const totalAllocated = (batches ?? []).reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
  const totalBeneficiaries = (batches ?? []).reduce((s, b) => s + (b.beneficiary_count ?? 0), 0);
  const remaining = Number(program.budget) - totalAllocated;

  // Pool balance untuk fund_type ini
  const { data: poolRow } = await supabase
    .from("fund_pool_view")
    .select("balance, total_donated, total_disbursed")
    .eq("institution_id", program.institution_id)
    .eq("fund_type", program.fund_type)
    .maybeSingle();

  const poolBalance = Number(poolRow?.balance ?? 0);

  // Fetch candidates kalau program ACTIVE
  let candidates: Awaited<ReturnType<typeof fetchAllocationCandidates>>["candidates"] = [];
  if (program.status === "ACTIVE") {
    const res = await fetchAllocationCandidates(id);
    if (res.success && res.candidates) {
      candidates = res.candidates;
    }
  }

  const cfgType = PROGRAM_TYPE[program.program_type as ProgramType] ?? PROGRAM_TYPE.RUTIN;
  const cfgStatus = PROGRAM_STATUS[program.status as ProgramStatus] ?? PROGRAM_STATUS.DRAFT;
  const isOwner = program.institution_id === ctx.institutionId;

  return (
    <div className="flex flex-col">
      <PageHeader
        title={program.name}
        description={`Detail program — ${ctx.institutionName}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Program", href: "/dashboard/program" },
          { label: program.name },
        ]}
      >
        <Link href="/dashboard/program" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="size-4 mr-2" />
          Daftar Program
        </Link>
      </PageHeader>

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        {/* Header info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 flex-wrap">
              <div className={`p-4 rounded-xl text-white ${cfgType.color}`}>
                <Calculator className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{program.name}</h2>
                  <Badge variant={cfgStatus.variant}>{cfgStatus.label}</Badge>
                  <Badge variant="outline">{fundLabel(program.fund_type)}</Badge>
                  <Badge variant="outline">
                    {ASSISTANCE_TYPE_LABELS[program.assistance_type as AssistanceType] ?? program.assistance_type}
                  </Badge>
                </div>
                {program.description && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-3xl">{program.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    {fmtDate(program.period_start)} – {fmtDate(program.period_end)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target className="size-4" />
                    Asnaf: {(program.target_asnaf as string[]).map(asnafLabel).join(", ")}
                  </span>
                </div>
              </div>

              {isOwner && (
                <ProgramActions
                  programId={program.id}
                  currentStatus={program.status as ProgramStatus}
                  hasBatches={(batches ?? []).length > 0}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Anggaran</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(program.budget)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Teralokasi</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{formatRupiah(totalAllocated)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalAllocated / Number(program.budget)) * 100).toFixed(1)}% dari budget
            </p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Sisa Budget</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(remaining)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Penerima</p>
            <p className="text-xl font-bold mt-1">
              {totalBeneficiaries}
              {program.beneficiary_target ? `/${program.beneficiary_target}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{(batches ?? []).length} batch</p>
          </CardContent></Card>
        </div>

        {/* Pool balance warning */}
        {isOwner && program.status === "ACTIVE" && poolBalance < remaining && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-5 flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900">
                  Saldo pool {fundLabel(program.fund_type)} tidak mencukupi sisa anggaran program
                </p>
                <p className="text-amber-800 mt-1">
                  Pool {fundLabel(program.fund_type)} {ctx.institutionName}:{" "}
                  <strong>{formatRupiah(poolBalance)}</strong> · Sisa anggaran program:{" "}
                  <strong>{formatRupiah(remaining)}</strong>. Anda masih bisa mengalokasikan
                  selama tidak melebihi saldo pool.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Allocation wizard — hanya kalau ACTIVE & owner */}
        {isOwner && program.status === "ACTIVE" && (
          <AllocationWizard
            programId={program.id}
            programName={program.name}
            fundType={program.fund_type}
            assistanceType={program.assistance_type}
            amountPerBeneficiary={Number(program.amount_per_beneficiary ?? 0)}
            remainingBudget={remaining}
            poolBalance={poolBalance}
            initialCandidates={candidates ?? []}
          />
        )}

        {/* Status hint untuk DRAFT */}
        {isOwner && program.status === "DRAFT" && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-2">
              <Wallet className="size-8 mx-auto text-muted-foreground/50" />
              <p className="font-medium">Program masih dalam DRAFT</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Aktifkan program (klik tombol di kanan atas) untuk mulai mengalokasikan dana ke
                mustahik dengan greedy knapsack.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Batches list */}
        {(batches ?? []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="size-5" />
                Riwayat Batch ({(batches ?? []).length})
              </CardTitle>
              <CardDescription>Batch yang dibuat dari program ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(batches ?? []).map((b) => {
                  const cfg = BATCH_STATUS[b.status as BatchStatus] ?? BATCH_STATUS.PROCESSING;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-bold">{b.batch_code}</code>
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {b.beneficiary_count} penerima · dibuat {fmtDateTime(b.created_at)}
                          {b.disbursed_at && ` · disalurkan ${fmtDateTime(b.disbursed_at)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatRupiah(b.total_amount)}</p>
                        <Link
                          href={`/lacak?kode=${encodeURIComponent(b.batch_code)}`}
                          className="text-xs text-primary hover:underline"
                          target="_blank"
                        >
                          Lacak →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
