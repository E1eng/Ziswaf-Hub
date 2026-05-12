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
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Target,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";
import { SectorChart } from "@/components/charts/sector-chart";

async function getDashboardData() {
  const supabase = await createClient();
  const year = 2024;
  const prevYear = 2023;

  const [
    { data: collCur },
    { data: collPrev },
    { data: distCur },
    { data: gapRows },
  ] = await Promise.all([
    supabase.from("mv_collection_by_region_year").select("total_amount, total_donors").eq("year", year),
    supabase.from("mv_collection_by_region_year").select("total_amount").eq("year", prevYear),
    supabase.from("mv_distribution_by_region_year")
      .select("region_name, sector_name, total_amount, total_beneficiaries")
      .eq("year", year),
    supabase.from("mv_gap_analysis")
      .select("region_name, poverty_rate, gap_percentage, population")
      .eq("year", year)
      .order("poverty_rate", { ascending: false })
      .limit(5),
  ]);

  const totalCollection = (collCur || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalCollPrev = (collPrev || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const collChange = totalCollPrev > 0 ? ((totalCollection - totalCollPrev) / totalCollPrev) * 100 : 0;
  const totalDonors = (collCur || []).reduce((s, r) => s + (r.total_donors || 0), 0);

  const totalDist = (distCur || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalBenef = (distCur || []).reduce((s, r) => s + (r.total_beneficiaries || 0), 0);

  // Distribution by sector
  const sectorMap = new Map<string, { amount: number; beneficiaries: number }>();
  for (const d of distCur || []) {
    const prev = sectorMap.get(d.sector_name || "") || { amount: 0, beneficiaries: 0 };
    sectorMap.set(d.sector_name || "", {
      amount: prev.amount + (d.total_amount || 0),
      beneficiaries: prev.beneficiaries + (d.total_beneficiaries || 0),
    });
  }
  const sectors = Array.from(sectorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // ACR (Allocation to Collection Ratio)
  const acr = totalCollection > 0 ? (totalDist / totalCollection) * 100 : 0;

  // Top priority regions
  const priorityRegions = (gapRows || []).map((g) => ({
    name: g.region_name || "",
    poverty_rate: g.poverty_rate || 0,
    gap_pct: g.gap_percentage || 0,
    population: g.population || 0,
  }));

  return {
    totalCollection, collChange, totalDonors,
    totalDist, totalBenef, acr,
    sectors, priorityRegions,
  };
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Dashboard Lembaga"
        description="Ringkasan kinerja pengumpulan & penyaluran ZISWAF Anda"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pengumpulan</CardTitle>
              <Banknote className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(d.totalCollection)}</div>
              <div className="flex items-center gap-1 mt-1">
                {d.collChange > 0 ? <TrendingUp className="size-3 text-green-600" /> : <TrendingDown className="size-3 text-red-600" />}
                <span className={`text-xs font-medium ${d.collChange > 0 ? "text-green-600" : "text-red-600"}`}>
                  {d.collChange > 0 ? "+" : ""}{formatPct(d.collChange)} YoY
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Penyaluran</CardTitle>
              <Target className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(d.totalDist)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(d.totalBenef, true)} penerima manfaat
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ACR</CardTitle>
              <Badge variant={d.acr >= 70 ? "secondary" : "destructive"} className="text-[10px]">
                {d.acr >= 70 ? "Baik" : "Perlu Ditingkatkan"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPct(d.acr)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Allocation to Collection Ratio
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Muzakki</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(d.totalDonors, true)}</div>
              <p className="text-xs text-muted-foreground mt-1">Donatur aktif</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Priority */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Langkah selanjutnya untuk lembaga Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/dashboard/targeting"
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium group-hover:text-primary">Lihat Rekomendasi Targeting</p>
                  <p className="text-xs text-muted-foreground">Daerah & asnaf prioritas penyaluran</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard/input"
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <PlusCircle className="size-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium group-hover:text-green-600">Input Data Baru</p>
                  <p className="text-xs text-muted-foreground">Submit pengumpulan atau penyaluran</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>

          {/* Priority Regions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daerah Prioritas</CardTitle>
                  <CardDescription>Kemiskinan tinggi — butuh penyaluran lebih</CardDescription>
                </div>
                <Link href="/dashboard/targeting" className="text-xs text-primary hover:underline">
                  Selengkapnya
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {d.priorityRegions.map((r, i) => (
                  <div key={r.name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-[10px]">
                        Miskin {formatPct(r.poverty_rate)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution by Sector */}
        <Card>
          <CardHeader>
            <CardTitle>Penyaluran per Sektor</CardTitle>
            <CardDescription>Distribusi dana berdasarkan bidang penyaluran 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <SectorChart data={d.sectors} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
