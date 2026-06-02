import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Building2,
  HandCoins,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInstitution } from "@/lib/institution";
import { formatRupiah } from "@/lib/utils/format";
import { maskNik } from "@/lib/utils/privacy";
import {
  asnafLabel,
  fundLabel,
  ASSESSMENT_STATUS,
  LIFECYCLE_STATUS,
  ASSISTANCE_TYPE_LABELS,
  type AssessmentStatus,
  type LifecycleStatus,
  type AssistanceType,
} from "@/lib/constants/ziswaf";
import { LifecycleActions } from "./lifecycle-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AssessmentRow {
  id: string;
  asnaf_category: string;
  priority_score: number;
  estimated_amount: number;
  status: string;
  source: string;
  submitted_at: string;
  reviewed_at: string | null;
  institution: { id: string; name: string } | null;
}

interface LogRow {
  id: string;
  assistance_type: string;
  fund_type: string;
  amount: number;
  period_start: string;
  period_end: string;
  created_at: string;
  institution: { name: string } | null;
  batch: { batch_code: string; status: string } | null;
}

export default async function MustahikDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await getCurrentInstitution();
  if (!ctx) redirect("/login");

  const supabase = await createClient();

  // Fetch mustahik registry
  const { data: m } = await supabase
    .from("mustahik_registry")
    .select(`
      id, nik, full_name, phone, address,
      lifecycle_status, lifecycle_changed_at, lifecycle_reason,
      pdp_consent_at, created_at,
      kecamatan:regions(name),
      first_inst:institutions!mustahik_registry_first_registered_by_institution_id_fkey(name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!m) notFound();

  const mustahik = m as unknown as {
    id: string;
    nik: string;
    full_name: string;
    phone: string | null;
    address: string | null;
    lifecycle_status: string;
    lifecycle_changed_at: string | null;
    lifecycle_reason: string | null;
    pdp_consent_at: string | null;
    created_at: string;
    kecamatan: { name: string } | null;
    first_inst: { name: string } | null;
  };

  // All assessments cross-institution
  const { data: assessmentsRaw } = await supabase
    .from("mustahik_assessments")
    .select(`
      id, asnaf_category, priority_score, estimated_amount, status, source,
      submitted_at, reviewed_at,
      institution:institutions(id, name)
    `)
    .eq("mustahik_id", id)
    .order("submitted_at", { ascending: false });

  const assessments = (assessmentsRaw ?? []) as unknown as AssessmentRow[];

  // Assistance log cross-institution
  const { data: logsRaw } = await supabase
    .from("assistance_log")
    .select(`
      id, assistance_type, fund_type, amount, period_start, period_end, created_at,
      institution:institutions(name),
      batch:disbursement_batches(batch_code, status)
    `)
    .eq("mustahik_id", id)
    .order("created_at", { ascending: false });

  const logs = (logsRaw ?? []) as unknown as LogRow[];

  // Aggregate stats
  const totalReceived = logs.reduce((s, l) => s + Number(l.amount ?? 0), 0);
  const institutionCount = new Set(logs.map((l) => l.institution?.name).filter(Boolean)).size;

  const lifecycleCfg =
    LIFECYCLE_STATUS[mustahik.lifecycle_status as LifecycleStatus] ??
    LIFECYCLE_STATUS.active;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Detail Mustahik"
        description={`Profil & riwayat bantuan — full transparency cross-institution`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Registry & Assessment", href: "/dashboard/proposal" },
          { label: mustahik.full_name },
        ]}
      >
        <Link
          href="/dashboard/proposal"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowLeft className="size-4 mr-2" />
          Kembali
        </Link>
      </PageHeader>

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl">
        {/* Identity card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="p-4 rounded-xl bg-primary/10 shrink-0">
                <User className="size-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold">{mustahik.full_name}</h2>
                  <Badge variant={lifecycleCfg.variant}>{lifecycleCfg.label}</Badge>
                </div>
                <code className="text-sm font-mono text-muted-foreground mt-1 inline-block">
                  NIK: {maskNik(mustahik.nik)}
                </code>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mt-4 text-sm">
                  {mustahik.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-4" />
                      <span>{mustahik.phone}</span>
                    </div>
                  )}
                  {mustahik.kecamatan && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-4" />
                      <span>{mustahik.kecamatan.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-4" />
                    <span>Terdaftar {fmtDate(mustahik.created_at)}</span>
                  </div>
                </div>
                {mustahik.address && (
                  <p className="text-sm text-muted-foreground mt-2">{mustahik.address}</p>
                )}
              </div>
              <LifecycleActions
                mustahikId={mustahik.id}
                currentStatus={mustahik.lifecycle_status as LifecycleStatus}
              />
            </div>

            {mustahik.lifecycle_reason && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                <p className="text-xs font-semibold text-amber-900 mb-1">
                  Catatan status ({lifecycleCfg.label}):
                </p>
                <p className="text-amber-800">{mustahik.lifecycle_reason}</p>
                {mustahik.lifecycle_changed_at && (
                  <p className="text-xs text-amber-700 mt-1">
                    Diubah {fmtDateTime(mustahik.lifecycle_changed_at)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aggregate stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Total Bantuan Diterima</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                {formatRupiah(totalReceived)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{logs.length} kali penyaluran</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Lembaga Penyalur</p>
              <p className="text-2xl font-bold mt-1">{institutionCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lembaga berbeda yang pernah salurkan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Total Assessment</p>
              <p className="text-2xl font-bold mt-1">{assessments.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mungkin di-assess multi-lembaga
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assessments cross-institution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="size-5" />
              Assessment per Lembaga
            </CardTitle>
            <CardDescription>
              Skor prioritas mungkin berbeda antar lembaga karena waktu &amp; metric assessment yang berbeda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Belum ada assessment
              </p>
            ) : (
              <div className="space-y-2">
                {assessments.map((a) => {
                  const st = ASSESSMENT_STATUS[a.status as AssessmentStatus] ?? ASSESSMENT_STATUS.PENDING;
                  return (
                    <div
                      key={a.id}
                      className="flex items-start gap-4 p-4 border rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{a.institution?.name ?? "—"}</span>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                          <Badge variant="outline" className="text-xs">{asnafLabel(a.asnaf_category)}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {a.source.toLowerCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                          <span>Submitted {fmtDate(a.submitted_at)}</span>
                          {a.reviewed_at && <span>Reviewed {fmtDate(a.reviewed_at)}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            a.priority_score >= 60
                              ? "text-red-600"
                              : a.priority_score >= 40
                              ? "text-amber-600"
                              : "text-green-600"
                          }`}
                        >
                          {a.priority_score}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatRupiah(a.estimated_amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assistance history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="size-5" />
              Riwayat Bantuan
            </CardTitle>
            <CardDescription>
              Source-of-truth untuk dedup cross-institution. Catatan ini ditulis otomatis oleh DB
              trigger saat batch DISBURSED.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                <HandCoins className="size-10 mx-auto opacity-30 mb-2" />
                Belum pernah menerima bantuan dari lembaga manapun
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-start gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 shrink-0">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {ASSISTANCE_TYPE_LABELS[l.assistance_type as AssistanceType] ??
                            l.assistance_type}
                        </span>
                        <Badge variant="outline" className="text-xs">{fundLabel(l.fund_type)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Dari <strong>{l.institution?.name ?? "—"}</strong>
                        {l.batch && (
                          <>
                            {" · batch "}
                            <Link
                              href={`/lacak?kode=${encodeURIComponent(l.batch.batch_code)}`}
                              className="text-primary hover:underline font-mono"
                              target="_blank"
                            >
                              {l.batch.batch_code}
                            </Link>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Periode {fmtDate(l.period_start)} – {fmtDate(l.period_end)} ·{" "}
                        Tercatat {fmtDate(l.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatRupiah(l.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDP consent info */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-3 text-sm">
              {mustahik.pdp_consent_at ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Persetujuan UU PDP tercatat</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mustahik telah memberikan consent untuk pencatatan data oleh{" "}
                      <strong>{mustahik.first_inst?.name ?? "lembaga awal"}</strong> pada{" "}
                      {fmtDate(mustahik.pdp_consent_at)}.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Belum ada catatan PDP consent</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Lembaga yang awal mendaftarkan mustahik harus mendokumentasikan consent UU PDP.
                    </p>
                  </div>
                </>
              )}
            </div>
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sesuai UU 27/2022 (PDP), data penerima manfaat hanya ditampilkan kepada lembaga
              terverifikasi. NIK selalu di-mask di antarmuka. Audit ledger immutable mencatat siapa
              mengakses apa.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
