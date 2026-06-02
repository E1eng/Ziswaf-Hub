"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Package,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Users,
  AlertCircle,
  Banknote,
  ShieldCheck,
  Clock,
  HandCoins,
  Building2,
} from "lucide-react";
import { formatRupiah, formatPct } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { BATCH_STATUS, BATCH_STATUS_FLOW, BatchStatus, fundLabel } from "@/lib/constants/ziswaf";

interface BatchData {
  id: string;
  batch_code: string;
  total_amount: number;
  beneficiary_count: number;
  fund_type: string;
  status: string;
  kecamatan_summary: { kecamatan: string; count: number }[];
  created_at: string;
  verified_at: string | null;
  disbursed_at: string | null;
  received_at: string | null;
  institution_id: string | null;
}

interface DonationData {
  id: string;
  donation_code: string;
  amount: number;
  fund_type: string;
  is_anonymous: boolean;
  donor_name: string | null;
  received_at: string | null;
  institution: { id: string; name: string } | null;
  pool: {
    total_donated: number;
    total_disbursed: number;
    balance: number;
    disbursement_pct: number;
  };
  recentBatches: Array<{
    batch_code: string;
    total_amount: number;
    beneficiary_count: number;
    status: string;
    disbursed_at: string | null;
    program_name: string | null;
  }>;
}

interface TimelineStep {
  label: string;
  description: string;
  icon: React.ElementType;
  time: string | null;
  active: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function detectCodeKind(code: string): "donation" | "batch" {
  // Donation code: D-2026-XXXXXX (alphanumeric)
  // Batch code: ZH-2026-XXXXXX or BATCH-XXXXX
  if (/^D-\d{4}-/i.test(code)) return "donation";
  return "batch";
}

function LacakInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [donation, setDonation] = useState<DonationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-search jika ada ?kode= di URL (dari email link)
  useEffect(() => {
    const urlCode = searchParams.get("kode");
    if (urlCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: pre-fill from URL
      setQuery(urlCode);
      void handleSearchInternal(urlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleSearchInternal(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError("");
    setBatch(null);
    setDonation(null);

    try {
      const supabase = createClient();
      const kind = detectCodeKind(code);

      if (kind === "donation") {
        await fetchDonation(supabase, code);
      } else {
        await fetchBatch(supabase, code);
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBatch(supabase: ReturnType<typeof createClient>, code: string) {
    const { data, error: err } = await supabase
      .from("disbursement_batches")
      .select("*")
      .eq("batch_code", code)
      .single();

    if (err || !data) {
      setError("Batch tidak ditemukan. Pastikan kode sudah benar.");
    } else {
      setBatch(data as unknown as BatchData);
    }
  }

  async function fetchDonation(supabase: ReturnType<typeof createClient>, code: string) {
    const { data: don, error: err } = await supabase
      .from("donations")
      .select(`
        id, donation_code, amount, fund_type, is_anonymous, donor_name, received_at,
        institution_id
      `)
      .eq("donation_code", code)
      .single();

    if (err || !don) {
      setError("Kode donasi tidak ditemukan. Pastikan kode sudah benar.");
      return;
    }

    // Fetch institution
    const { data: inst } = await supabase
      .from("institutions")
      .select("id, name")
      .eq("id", don.institution_id)
      .single();

    // Fetch pool status untuk (institution_id, fund_type)
    const { data: pool } = await supabase
      .from("fund_pool_view")
      .select("total_donated, total_disbursed, balance, disbursement_pct")
      .eq("institution_id", don.institution_id)
      .eq("fund_type", don.fund_type)
      .maybeSingle();

    // Fetch 5 batch terbaru lembaga ini di fund_type yang sama,
    // join programs untuk tampil program_name
    const { data: batchesRaw } = await supabase
      .from("disbursement_batches")
      .select("batch_code, total_amount, beneficiary_count, status, disbursed_at, program_id")
      .eq("institution_id", don.institution_id)
      .eq("fund_type", don.fund_type)
      .in("status", ["DISBURSED", "RECEIVED"])
      .order("disbursed_at", { ascending: false, nullsFirst: false })
      .limit(5);

    const programIds = (batchesRaw ?? []).map((b) => b.program_id).filter(Boolean) as string[];
    const programMap = new Map<string, string>();
    if (programIds.length > 0) {
      const { data: progs } = await supabase
        .from("programs")
        .select("id, name")
        .in("id", programIds);
      for (const p of progs ?? []) programMap.set(p.id, p.name);
    }

    const recentBatches = (batchesRaw ?? []).map((b) => ({
      batch_code: b.batch_code,
      total_amount: Number(b.total_amount ?? 0),
      beneficiary_count: b.beneficiary_count ?? 0,
      status: b.status,
      disbursed_at: b.disbursed_at,
      program_name: b.program_id ? programMap.get(b.program_id) ?? null : null,
    }));

    setDonation({
      id: don.id,
      donation_code: don.donation_code,
      amount: Number(don.amount ?? 0),
      fund_type: don.fund_type,
      is_anonymous: don.is_anonymous ?? false,
      donor_name: don.donor_name,
      received_at: don.received_at,
      institution: inst ? { id: inst.id, name: inst.name } : null,
      pool: {
        total_donated: Number(pool?.total_donated ?? 0),
        total_disbursed: Number(pool?.total_disbursed ?? 0),
        balance: Number(pool?.balance ?? 0),
        disbursement_pct: Number(pool?.disbursement_pct ?? 0),
      },
      recentBatches,
    });
  }

  const handleSearch = () => void handleSearchInternal(query);

  const buildBatchTimeline = (b: BatchData): TimelineStep[] => {
    const kecNames = (b.kecamatan_summary || []).map((k) => k.kecamatan).join(", ");
    const totalPeople = b.beneficiary_count;
    const currentIdx = BATCH_STATUS_FLOW.indexOf(b.status as BatchStatus);

    return [
      {
        label: "Dana Dialokasikan",
        description: `Sistem memilih ${totalPeople} mustahik berdasarkan skor prioritas tertinggi`,
        icon: Banknote,
        time: b.created_at,
        active: currentIdx >= 0,
      },
      {
        label: "Verifikasi Kelayakan",
        description: "Data NIK divalidasi — tidak ada duplikasi atau penerima ganda",
        icon: ShieldCheck,
        time: b.verified_at,
        active: currentIdx >= 1,
      },
      {
        label: "Dana Disalurkan",
        description: `Dana ${formatRupiah(b.total_amount)} (${fundLabel(b.fund_type)}) ditransfer ke ${totalPeople} penerima`,
        icon: CheckCircle,
        time: b.disbursed_at,
        active: currentIdx >= 2,
      },
      {
        label: "Diterima Mustahik",
        description: kecNames
          ? `Diterima di: ${kecNames}`
          : `Diterima oleh ${totalPeople} mustahik`,
        icon: MapPin,
        time: b.received_at,
        active: currentIdx >= 3,
      },
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-5" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              Z
            </div>
            <span className="font-bold text-lg">ZISWAF Hub</span>
          </Link>
          <Badge variant="outline" className="text-sm">
            Lacak Penyaluran
          </Badge>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Search */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Lacak Donasi & Penyaluran</h1>
          <p className="text-lg text-muted-foreground">
            Masukkan kode donasi (D-...) atau kode batch (ZH-...) untuk melihat statusnya
          </p>
        </div>

        <div className="flex gap-3 max-w-xl mx-auto mb-10">
          <Input
            placeholder="Contoh: D-2026-A1B2C3 atau ZH-2026-123456"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-12 text-lg"
          />
          <Button size="lg" className="h-12 px-6" onClick={handleSearch} disabled={loading}>
            <Search className="size-5 mr-2" />
            {loading ? "Mencari..." : "Lacak"}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Card className="max-w-xl mx-auto border-destructive">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="size-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Donation result (Pool model) */}
        {donation && <DonationResult donation={donation} />}

        {/* Batch result */}
        {batch && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-mono">{batch.batch_code}</CardTitle>
                    <p className="text-muted-foreground mt-1">{formatDate(batch.created_at)}</p>
                  </div>
                  <Badge className={BATCH_STATUS[batch.status as BatchStatus]?.color ?? BATCH_STATUS.PROCESSING.color}>
                    {BATCH_STATUS[batch.status as BatchStatus]?.label ?? batch.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 text-center">
                    <Banknote className="size-6 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Total Dana</p>
                    <p className="text-xl font-bold text-primary">{formatRupiah(batch.total_amount)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 text-center">
                    <Users className="size-6 mx-auto text-emerald-600 mb-2" />
                    <p className="text-sm text-muted-foreground">Penerima</p>
                    <p className="text-xl font-bold text-emerald-600">{batch.beneficiary_count} mustahik</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 text-center">
                    <Package className="size-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-sm text-muted-foreground">Jenis Dana</p>
                    <p className="text-xl font-bold text-blue-600">{fundLabel(batch.fund_type)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Jejak Penyaluran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-8">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-muted" />
                  {buildBatchTimeline(batch).map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <div key={idx} className="relative pb-8 last:pb-0">
                        <div
                          className={`absolute -left-8 top-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                            step.active ? "bg-green-500" : "bg-muted border-2 border-muted-foreground/20"
                          }`}
                        >
                          <Icon className={`size-4 ${step.active ? "text-white" : "text-muted-foreground/50"}`} />
                        </div>
                        <div className="ml-4">
                          <p className={`font-semibold text-base ${!step.active && "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                          {step.active && step.time && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatDate(step.time)}
                            </p>
                          )}
                          {!step.active && (
                            <p className="text-xs text-muted-foreground/60 mt-1 italic">Menunggu...</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {batch.kecamatan_summary && batch.kecamatan_summary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="size-5 text-primary" />
                    Distribusi per Kecamatan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {batch.kecamatan_summary.map((k, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{k.kecamatan || "Kecamatan " + (idx + 1)}</span>
                        <Badge variant="secondary">{k.count} mustahik</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <PrivacyNotice />

            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                ← Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}

        {/* Placeholder when no search */}
        {!batch && !donation && !error && (
          <div className="text-center text-muted-foreground mt-12">
            <Package className="size-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Masukkan kode untuk memulai pelacakan</p>
            <div className="text-sm mt-2 space-y-1">
              <p>
                Kode donasi (untuk muzakki):{" "}
                <code className="bg-muted px-2 py-0.5 rounded">D-2026-A1B2C3</code>
              </p>
              <p>
                Kode batch penyaluran:{" "}
                <code className="bg-muted px-2 py-0.5 rounded">ZH-2026-123456</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DonationResult({ donation }: { donation: DonationData }) {
  const greetingName = donation.is_anonymous
    ? "Donatur Anonim"
    : donation.donor_name ?? "Bapak/Ibu";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-2xl font-mono">{donation.donation_code}</CardTitle>
              <p className="text-muted-foreground mt-1">{formatDate(donation.received_at)}</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800">
              <HandCoins className="size-3 mr-1" /> Donasi Diterima
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base mb-4">
            Terima kasih, <strong>{greetingName}</strong>. Donasi Anda{" "}
            <strong>{formatRupiah(donation.amount)} ({fundLabel(donation.fund_type)})</strong>{" "}
            telah masuk ke pool {donation.institution?.name ?? "lembaga"}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 text-center">
              <Banknote className="size-6 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Donasi Anda</p>
              <p className="text-xl font-bold text-primary">{formatRupiah(donation.amount)}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 text-center">
              <Package className="size-6 mx-auto text-blue-600 mb-2" />
              <p className="text-sm text-muted-foreground">Jenis Dana</p>
              <p className="text-xl font-bold text-blue-600">{fundLabel(donation.fund_type)}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 text-center">
              <Building2 className="size-6 mx-auto text-emerald-600 mb-2" />
              <p className="text-sm text-muted-foreground">Lembaga</p>
              <p className="text-base font-semibold text-emerald-700 leading-tight">
                {donation.institution?.name ?? "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pool status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Status Pool {fundLabel(donation.fund_type)} — {donation.institution?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Stat label="Total Terkumpul" value={formatRupiah(donation.pool.total_donated)} />
            <Stat
              label="Sudah Tersalur"
              value={formatRupiah(donation.pool.total_disbursed)}
              accent="text-emerald-600"
            />
            <Stat label="Saldo Pool" value={formatRupiah(donation.pool.balance)} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tingkat penyaluran pool</span>
              <span className="font-semibold">{formatPct(donation.pool.disbursement_pct)}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, donation.pool.disbursement_pct))}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Karena dana di pool bersifat <em>fungible</em> (uang tidak memiliki identitas individu),
            kami menampilkan status agregat pool secara jujur, bukan attribusi semu donasi spesifik
            ke batch tertentu.
          </p>
        </CardContent>
      </Card>

      {/* Recent batches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Penyaluran Terbaru dari Pool yang Sama</CardTitle>
        </CardHeader>
        <CardContent>
          {donation.recentBatches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Belum ada penyaluran dari pool {fundLabel(donation.fund_type)} ini.
            </p>
          ) : (
            <div className="space-y-2">
              {donation.recentBatches.map((b) => (
                <div
                  key={b.batch_code}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold">{b.batch_code}</code>
                      <Badge className={BATCH_STATUS[b.status as BatchStatus]?.color ?? "bg-muted"}>
                        {BATCH_STATUS[b.status as BatchStatus]?.label ?? b.status}
                      </Badge>
                    </div>
                    {b.program_name && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">{b.program_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {b.beneficiary_count} penerima • {formatDate(b.disbursed_at)}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold">{formatRupiah(b.total_amount)}</p>
                    <Link
                      href={`/lacak?kode=${encodeURIComponent(b.batch_code)}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Lacak →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PrivacyNotice />

      <div className="text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function PrivacyNotice() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <ShieldCheck className="size-5 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium text-amber-800 text-sm">Privasi Terlindungi</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Data penerima manfaat (NIK, nama) tidak ditampilkan di halaman publik ini sesuai
          UU Perlindungan Data Pribadi (UU PDP).
        </p>
      </div>
    </div>
  );
}

export default function LacakPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <LacakInner />
    </Suspense>
  );
}
