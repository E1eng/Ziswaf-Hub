"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Package,
  CheckCircle,
  Clock,
  Truck,
  ArrowLeft,
  MapPin,
  Users,
  Building2,
  AlertCircle,
} from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";

interface BatchData {
  id: string;
  batch_code: string;
  total_amount: number;
  donor_count: number;
  beneficiary_count: number;
  status: string;
  program_name: string;
  region_name: string;
  institution_name: string;
  description: string;
  collected_at: string | null;
  allocated_at: string | null;
  distributed_at: string | null;
  confirmed_at: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType; step: number }
> = {
  collected: { label: "Dana Terkumpul", color: "bg-blue-500", icon: Package, step: 1 },
  allocated: { label: "Dialokasikan", color: "bg-amber-500", icon: Clock, step: 2 },
  distributed: { label: "Disalurkan", color: "bg-emerald-500", icon: Truck, step: 3 },
  confirmed: { label: "Dikonfirmasi", color: "bg-primary", icon: CheckCircle, step: 4 },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
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
        .from("donation_batches")
        .select("*")
        .eq("batch_code", query.trim().toUpperCase())
        .single();

      if (err || !data) {
        setError("Batch tidak ditemukan. Pastikan kode batch sudah benar.");
      } else {
        setBatch(data as BatchData);
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = batch ? STATUS_CONFIG[batch.status] : null;

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
            Lacak Donasi
          </Badge>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Search */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Lacak Status Donasi</h1>
          <p className="text-lg text-muted-foreground">
            Masukkan kode batch untuk melihat status penyaluran dana
          </p>
        </div>

        <div className="flex gap-3 max-w-xl mx-auto mb-10">
          <Input
            placeholder="Contoh: ZH-2024-000001"
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
        {batch && statusInfo && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{batch.batch_code}</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {batch.program_name}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`${statusInfo.color} text-white text-sm px-3 py-1`}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Timeline */}
                <div className="flex items-center justify-between mb-8">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const isActive = config.step <= statusInfo.step;
                    const Icon = config.icon;
                    return (
                      <div key={key} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="size-5" />
                        </div>
                        <p className={`text-xs font-medium text-center ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                          {config.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {key === "collected" && formatDate(batch.collected_at)}
                          {key === "allocated" && formatDate(batch.allocated_at)}
                          {key === "distributed" && formatDate(batch.distributed_at)}
                          {key === "confirmed" && formatDate(batch.confirmed_at)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Separator className="mb-6" />

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lembaga</p>
                      <p className="font-semibold">{batch.institution_name || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <MapPin className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Daerah Penyaluran</p>
                      <p className="font-semibold">{batch.region_name || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Users className="size-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah Donatur</p>
                      <p className="font-semibold">{formatNumber(batch.donor_count)} orang</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground">Total Dana</p>
                    <p className="text-2xl font-bold text-primary">{formatRupiah(batch.total_amount)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/5">
                    <p className="text-sm text-muted-foreground">Penerima Manfaat</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {batch.beneficiary_count > 0 ? `${formatNumber(batch.beneficiary_count)} orang` : "Belum tersalurkan"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
              Contoh kode: <code className="bg-muted px-2 py-0.5 rounded">ZH-2024-000001</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
