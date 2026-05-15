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
import { ZiswafBreakdownChart } from "@/components/charts/ziswaf-breakdown-chart";

async function getDashboardData() {
  const supabase = await createClient();
  const year = 2024;
  const prevYear = 2023;

  const [
    { data: collCur },
    { data: collPrev },
    { data: distCur },
    { data: gapRows },
    { data: wakafSummary },
  ] = await Promise.all([
    supabase.from("mv_collection_by_region_year")
      .select("total_amount, total_donors, ziswaf_category")
      .eq("year", year),
    supabase.from("mv_collection_by_region_year").select("total_amount").eq("year", prevYear),
    supabase.from("mv_distribution_by_region_year")
      .select("region_name, sector_name, total_amount, total_beneficiaries")
      .eq("year", year),
    supabase.from("mv_gap_analysis")
      .select("region_name, poverty_rate, gap_percentage, population")
      .eq("year", year)
      .order("poverty_rate", { ascending: false })
      .limit(5),
    supabase.from("mv_wakaf_summary_by_province")
      .select("total_locations, productive_count, total_estimated_value, total_area_hectares"),
  ]);

  const totalCollection = (collCur || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalCollPrev = (collPrev || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const collChange = totalCollPrev > 0 ? ((totalCollection - totalCollPrev) / totalCollPrev) * 100 : 0;
  const totalDonors = (collCur || []).reduce((s, r) => s + (r.total_donors || 0), 0);

  // ZISWAF breakdown by category
  const ziswafMap = new Map<string, number>();
  for (const c of collCur || []) {
    const cat = c.ziswaf_category || "lainnya";
    ziswafMap.set(cat, (ziswafMap.get(cat) || 0) + (c.total_amount || 0));
  }
  const ziswafBreakdown = Array.from(ziswafMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

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

  // ACR
  const acr = totalCollection > 0 ? (totalDist / totalCollection) * 100 : 0;

  // Wakaf aggregates
  const wakafLocations = (wakafSummary || []).reduce((s, r) => s + (r.total_locations || 0), 0);
  const wakafProductive = (wakafSummary || []).reduce((s, r) => s + (r.productive_count || 0), 0);
  const wakafValue = (wakafSummary || []).reduce((s, r) => s + (r.total_estimated_value || 0), 0);
  const wakafArea = (wakafSummary || []).reduce((s, r) => s + (r.total_area_hectares || 0), 0);
  const wakafProductivePct = wakafLocations > 0 ? (wakafProductive / wakafLocations) * 100 : 0;

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
    ziswafBreakdown,
    wakafLocations, wakafProductivePct, wakafValue, wakafArea,
    sectors, priorityRegions,
  };
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Beranda"
        description="Ringkasan data ZISWAF lembaga Anda"
      />

      <main className="flex-1 p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Total Pengumpulan</CardTitle>
              <Banknote className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatRupiah(d.totalCollection)}</div>
              <div className="flex items-center gap-1.5 mt-2">
                {d.collChange > 0 ? <TrendingUp className="size-4 text-green-600" /> : <TrendingDown className="size-4 text-red-600" />}
                <span className={`text-sm font-medium ${d.collChange > 0 ? "text-green-600" : "text-red-600"}`}>
                  {d.collChange > 0 ? "+" : ""}{formatPct(d.collChange)} dari tahun lalu
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Penyaluran</CardTitle>
              <Target className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatRupiah(d.totalDist)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {formatNumber(d.totalBenef, true)} orang menerima bantuan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Rasio Penyaluran</CardTitle>
              <Badge variant={d.acr >= 70 ? "secondary" : "destructive"} className="text-sm">
                {d.acr >= 70 ? "Baik" : "Perlu Ditingkatkan"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatPct(d.acr)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Dari total yang dikumpulkan, berapa % yang sudah disalurkan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">Jumlah Donatur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(d.totalDonors, true)}</div>
              <p className="text-sm text-muted-foreground mt-2">Orang yang menyalurkan dana</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Priority */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Yang Bisa Anda Lakukan</CardTitle>
              <CardDescription className="text-sm">Pilih menu di bawah untuk melanjutkan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/dashboard/targeting"
                className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold group-hover:text-primary">Lihat Rekomendasi Daerah</p>
                  <p className="text-sm text-muted-foreground">Daerah mana yang paling butuh bantuan</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard/input"
                className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <PlusCircle className="size-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold group-hover:text-green-600">Tambah Data Baru</p>
                  <p className="text-sm text-muted-foreground">Catat data pengumpulan atau penyaluran</p>
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
                  <CardTitle className="text-xl">Daerah yang Butuh Bantuan</CardTitle>
                  <CardDescription className="text-sm">Daerah dengan tingkat kemiskinan tertinggi</CardDescription>
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
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-base">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-sm px-2.5 py-0.5">
                        Kemiskinan {formatPct(r.poverty_rate)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ZISWAF Breakdown + Sector Distribution */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Jenis Dana yang Terkumpul</CardTitle>
              <CardDescription className="text-sm">Pembagian pengumpulan: Zakat, Infaq, Sedekah, Wakaf (tahun 2024)</CardDescription>
            </CardHeader>
            <CardContent>
              <ZiswafBreakdownChart data={d.ziswafBreakdown} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Penyaluran ke Bidang Apa Saja</CardTitle>
              <CardDescription className="text-sm">Kemana saja dana disalurkan pada tahun 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <SectorChart data={d.sectors} />
            </CardContent>
          </Card>
        </div>

        {/* Wakaf Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Data Wakaf</CardTitle>
            <CardDescription className="text-sm">Jumlah dan kondisi aset wakaf yang tercatat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-5 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{formatNumber(d.wakafLocations)}</p>
                <p className="text-sm text-muted-foreground mt-2">Lokasi Wakaf</p>
              </div>
              <div className="text-center p-5 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{formatPct(d.wakafProductivePct)}</p>
                <p className="text-sm text-muted-foreground mt-2">Sudah Produktif</p>
              </div>
              <div className="text-center p-5 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{formatRupiah(d.wakafValue)}</p>
                <p className="text-sm text-muted-foreground mt-2">Perkiraan Nilai</p>
              </div>
              <div className="text-center p-5 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{formatNumber(Math.round(d.wakafArea))}</p>
                <p className="text-sm text-muted-foreground mt-2">Total Luas (Hektar)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
