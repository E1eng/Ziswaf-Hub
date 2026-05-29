"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";

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

export default function LacakPage() {
  const [query, setQuery] = useState("");
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setBatch(null);

    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("disbursement_batches")
        .select("*")
        .eq("batch_code", query.trim().toUpperCase())
        .single();

      if (err || !data) {
        setError("Batch tidak ditemukan. Pastikan kode batch sudah benar.");
      } else {
        setBatch(data as unknown as BatchData);
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (b: BatchData): TimelineStep[] => {
    const kecNames = (b.kecamatan_summary || []).map((k) => k.kecamatan).join(", ");
    const totalPeople = b.beneficiary_count;
    const statusOrder = ["PROCESSING", "VERIFIED", "DISBURSED", "RECEIVED"];
    const currentIdx = statusOrder.indexOf(b.status);

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
        description: `Dana ${formatRupiah(b.total_amount)} (${b.fund_type}) ditransfer ke ${totalPeople} penerima`,
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
          <h1 className="text-3xl font-bold mb-2">Lacak Penyaluran Dana</h1>
          <p className="text-lg text-muted-foreground">
            Masukkan kode batch untuk melihat jejak penyaluran (anonim — tanpa data pribadi)
          </p>
        </div>

        <div className="flex gap-3 max-w-xl mx-auto mb-10">
          <Input
            placeholder="Contoh: ZH-2026-123456"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-12 text-lg"
          />
          <Button
            size="lg"
            className="h-12 px-6"
            onClick={handleSearch}
            disabled={loading}
          >
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

        {/* Result */}
        {batch && (
          <div className="space-y-6">
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-mono">{batch.batch_code}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {formatDate(batch.created_at)}
                    </p>
                  </div>
                  <Badge className={`text-sm px-3 py-1 ${
                    batch.status === "RECEIVED" ? "bg-emerald-500 text-white" :
                    batch.status === "DISBURSED" ? "bg-green-500 text-white" :
                    batch.status === "VERIFIED" ? "bg-amber-500 text-white" :
                    "bg-blue-500 text-white"
                  }`}>
                    {batch.status === "RECEIVED" ? "Diterima" :
                     batch.status === "DISBURSED" ? "Disalurkan" :
                     batch.status === "VERIFIED" ? "Terverifikasi" : "Diproses"}
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
                    <p className="text-xl font-bold text-blue-600">{batch.fund_type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vertical Timeline (Shopee-style) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Jejak Penyaluran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-8">
                  {/* Vertical line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-muted" />

                  {buildTimeline(batch).map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <div key={idx} className="relative pb-8 last:pb-0">
                        {/* Dot */}
                        <div className={`absolute -left-8 top-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                          step.active ? "bg-green-500" : "bg-muted border-2 border-muted-foreground/20"
                        }`}>
                          <Icon className={`size-4 ${step.active ? "text-white" : "text-muted-foreground/50"}`} />
                        </div>
                        {/* Content */}
                        <div className="ml-4">
                          <p className={`font-semibold text-base ${!step.active && "text-muted-foreground"}`}>{step.label}</p>
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

            {/* Kecamatan Summary (Anonymized) */}
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

            {/* Privacy Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="size-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Privasi Terlindungi</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Data penerima (NIK, nama) tidak ditampilkan di halaman publik ini sesuai UU Perlindungan Data Pribadi (UU PDP).
                </p>
              </div>
            </div>

            {/* Back link */}
            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                ← Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}

        {/* Placeholder when no search */}
        {!batch && !error && (
          <div className="text-center text-muted-foreground mt-12">
            <Package className="size-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Masukkan kode batch untuk memulai pelacakan</p>
            <p className="text-sm mt-2">
              Contoh kode: <code className="bg-muted px-2 py-0.5 rounded">ZH-2026-123456</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
