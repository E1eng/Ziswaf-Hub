import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";
import { GitCompare, TrendingUp, TrendingDown } from "lucide-react";

async function getBenchmarkData() {
  const supabase = await createClient();
  const year = 2024;

  const [{ data: collRows }, { data: distRows }, { data: instCount }] = await Promise.all([
    supabase.from("mv_collection_by_region_year").select("total_amount, total_donors").eq("year", year),
    supabase.from("mv_distribution_by_region_year").select("total_amount, total_beneficiaries").eq("year", year),
    supabase.from("institutions").select("id"),
  ]);

  const totalCollection = (collRows || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalDist = (distRows || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalDonors = (collRows || []).reduce((s, r) => s + (r.total_donors || 0), 0);
  const totalBenef = (distRows || []).reduce((s, r) => s + (r.total_beneficiaries || 0), 0);
  const lembagaCount = (instCount || []).length;

  const avgCollection = lembagaCount > 0 ? totalCollection / lembagaCount : 0;
  const avgDist = lembagaCount > 0 ? totalDist / lembagaCount : 0;
  const avgDonors = lembagaCount > 0 ? Math.round(totalDonors / lembagaCount) : 0;
  const avgBenef = lembagaCount > 0 ? Math.round(totalBenef / lembagaCount) : 0;
  const acr = totalCollection > 0 ? (totalDist / totalCollection) * 100 : 0;

  return {
    totalCollection, totalDist, totalDonors, totalBenef,
    lembagaCount, avgCollection, avgDist, avgDonors, avgBenef, acr,
  };
}

export default async function BenchmarkPage() {
  const d = await getBenchmarkData();

  // Simulated "my" data for demo purposes (in real app, fetched based on auth user)
  const myCollection = d.avgCollection * 0.85; // slightly below average for demo
  const myDist = d.avgDist * 0.92;
  const myDonors = Math.round(d.avgDonors * 0.78);
  const myAcr = myCollection > 0 ? (myDist / myCollection) * 100 : 0;

  const metrics = [
    {
      label: "Pengumpulan",
      mine: myCollection,
      avg: d.avgCollection,
      format: formatRupiah,
      better: myCollection >= d.avgCollection,
    },
    {
      label: "Penyaluran",
      mine: myDist,
      avg: d.avgDist,
      format: formatRupiah,
      better: myDist >= d.avgDist,
    },
    {
      label: "Rasio Penyaluran (berapa % dana yang tersalurkan)",
      mine: myAcr,
      avg: d.acr,
      format: (v: number) => formatPct(v),
      better: myAcr >= d.acr,
    },
    {
      label: "Jumlah Donatur",
      mine: myDonors,
      avg: d.avgDonors,
      format: (v: number) => formatNumber(Math.round(v)),
      better: myDonors >= d.avgDonors,
    },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Perbandingan"
        description="Bagaimana kinerja lembaga Anda dibanding rata-rata lembaga lain di Indonesia?"
      />

      <main className="flex-1 p-6 space-y-6">
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GitCompare className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Dibandingkan dengan {d.lembagaCount} lembaga lain yang terdaftar</p>
                <p className="text-xs text-muted-foreground">Data tahun 2024 — nama lembaga lain tidak ditampilkan (rahasia)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((m) => (
            <Card key={m.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Lembaga Anda</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{m.format(m.mine)}</span>
                      {m.better ? (
                        <TrendingUp className="size-4 text-green-600" />
                      ) : (
                        <TrendingDown className="size-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Rata-rata Nasional</span>
                    <span className="text-sm font-medium text-muted-foreground">{m.format(m.avg)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 relative">
                    <div
                      className={`rounded-full h-2 ${m.better ? "bg-green-500" : "bg-orange-500"}`}
                      style={{ width: `${Math.min((m.mine / Math.max(m.avg, 1)) * 100, 150)}%`, maxWidth: "100%" }}
                    />
                    <div
                      className="absolute top-0 w-0.5 h-2 bg-foreground/50"
                      style={{ left: "100%" }}
                      title="Rata-rata"
                    />
                  </div>
                  <Badge variant={m.better ? "secondary" : "outline"} className="text-xs">
                    {m.better ? "Lebih baik dari rata-rata" : "Masih di bawah rata-rata"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Perbandingan ini menggunakan data dari {d.lembagaCount} lembaga yang terdaftar di ZISWAF Hub.
              Nama lembaga lain dirahasiakan. Rasio penyaluran yang baik adalah 70% ke atas —
              artinya dari setiap Rp100 yang dikumpulkan, minimal Rp70 sudah disalurkan.
              Gunakan menu <strong>Rekomendasi Daerah</strong> untuk melihat kemana sebaiknya dana disalurkan.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
