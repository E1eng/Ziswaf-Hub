import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";
import { ArrowRight } from "lucide-react";
import { ZiswafBreakdownChart } from "@/components/charts/ziswaf-breakdown-chart";

async function getAnalitikData() {
  const supabase = await createClient();
  const year = 2024;

  const [{ data: gapRows }, { data: distRows }, { data: collRows }, { data: wakaf }] = await Promise.all([
    supabase.from("mv_gap_analysis").select("*").eq("year", year).order("gap_percentage", { ascending: false }),
    supabase.from("mv_distribution_by_region_year")
      .select("region_id, region_name, sector_name, total_amount, total_beneficiaries")
      .eq("year", year),
    supabase.from("mv_collection_by_region_year")
      .select("region_name, total_amount, total_donors, ziswaf_category")
      .eq("year", year).eq("region_type", "provinsi"),
    supabase.from("mv_wakaf_summary_by_province").select("total_locations, productive_count, total_estimated_value"),
  ]);

  const gap = gapRows || [];
  const totalPotential = gap.reduce((s, r) => s + (r.estimated_potential || 0), 0);
  const totalActual = gap.reduce((s, r) => s + (r.actual_collection || 0), 0);
  const gapPct = totalPotential > 0 ? ((totalPotential - totalActual) / totalPotential) * 100 : 0;

  // Top provinces by collection
  const provMap = new Map<string, number>();
  for (const c of collRows || []) {
    provMap.set(c.region_name || "", (provMap.get(c.region_name || "") || 0) + (c.total_amount || 0));
  }
  const topProvinces = Array.from(provMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Distribution by sector
  const sectorMap = new Map<string, { amount: number; beneficiaries: number }>();
  for (const d of distRows || []) {
    const prev = sectorMap.get(d.sector_name || "") || { amount: 0, beneficiaries: 0 };
    sectorMap.set(d.sector_name || "", {
      amount: prev.amount + (d.total_amount || 0),
      beneficiaries: prev.beneficiaries + (d.total_beneficiaries || 0),
    });
  }
  const sectors = Array.from(sectorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount);
  const totalDist = sectors.reduce((s, r) => s + r.amount, 0);
  const totalBenef = sectors.reduce((s, r) => s + r.beneficiaries, 0);

  // Gap top 5 worst
  const top5Gap = gap.slice(0, 5);

  // Wakaf
  const wakafTotal = {
    locations: (wakaf || []).reduce((s, r) => s + (r.total_locations || 0), 0),
    productive: (wakaf || []).reduce((s, r) => s + (r.productive_count || 0), 0),
    value: (wakaf || []).reduce((s, r) => s + (r.total_estimated_value || 0), 0),
  };

  const totalCollection = (collRows || []).reduce((s, r) => s + (r.total_amount || 0), 0);

  // ZISWAF category breakdown
  const ziswafMap = new Map<string, number>();
  for (const c of collRows || []) {
    const cat = c.ziswaf_category || "lainnya";
    ziswafMap.set(cat, (ziswafMap.get(cat) || 0) + (c.total_amount || 0));
  }
  const ziswafBreakdown = Array.from(ziswafMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { totalCollection, totalDist, totalBenef, totalPotential, gapPct, topProvinces, sectors, top5Gap, wakafTotal, ziswafBreakdown };
}

export default async function AnalitikPage() {
  const d = await getAnalitikData();
  const totalSectorAmt = d.sectors.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl">
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-base font-bold">Z</span>
            </div>
            ZISWAF Hub
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-base">
            <Link href="/analitik" className="font-medium">Data Nasional</Link>
            <Link href="/direktori" className="text-muted-foreground hover:text-foreground">Direktori</Link>
          </nav>
          <Link href="/login" className="px-5 py-2.5 text-base font-medium border rounded-xl hover:bg-muted">
            Masuk
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Data ZISWAF Nasional</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Rangkuman data Zakat, Infaq, Sedekah, dan Wakaf seluruh Indonesia tahun 2024
          </p>
        </div>

        {/* Summary */}
        <div className="grid gap-5 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{formatRupiah(d.totalCollection)}</p>
              <p className="text-sm text-muted-foreground mt-2">Total Pengumpulan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{formatRupiah(d.totalDist)}</p>
              <p className="text-sm text-muted-foreground mt-2">Total Penyaluran</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{formatNumber(d.totalBenef, true)}</p>
              <p className="text-sm text-muted-foreground mt-2">Penerima Manfaat</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-600">{formatPct(d.gapPct)}</p>
              <p className="text-sm text-muted-foreground mt-2">Potensi Belum Tercapai</p>
            </CardContent>
          </Card>
        </div>

        {/* ZISWAF Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Jenis Dana yang Terkumpul</CardTitle>
            <CardDescription className="text-sm">Pembagian pengumpulan: Zakat, Infaq, Sedekah, Wakaf, dan DSKL — tahun 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ZiswafBreakdownChart data={d.ziswafBreakdown} />
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Provinces */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">10 Provinsi Pengumpulan Terbanyak</CardTitle>
              <CardDescription className="text-sm">Provinsi dengan total pengumpulan ZISWAF terbesar tahun 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {d.topProvinces.map((p, i) => {
                  const pct = d.totalCollection > 0 ? (p.amount / d.totalCollection) * 100 : 0;
                  return (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-base">{p.name}</span>
                          <span className="text-sm text-muted-foreground">{formatRupiah(p.amount)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="bg-primary rounded-full h-2.5" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Distribution by Sector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Penyaluran ke Bidang Apa Saja</CardTitle>
              <CardDescription className="text-sm">Kemana saja dana ZISWAF disalurkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {d.sectors.slice(0, 8).map((s) => {
                  const pct = totalSectorAmt > 0 ? (s.amount / totalSectorAmt) * 100 : 0;
                  return (
                    <div key={s.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-base">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{formatNumber(s.beneficiaries, true)} orang</span>
                          <Badge variant="secondary" className="text-sm">{formatPct(pct)}</Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary rounded-full h-1.5" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Daerah yang Paling Butuh Perhatian</CardTitle>
            <CardDescription className="text-sm">
              Provinsi dimana potensi ZISWAF masih jauh dari yang terkumpul — artinya masih banyak yang bisa ditingkatkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {d.top5Gap.map((g) => (
                <div key={g.region_id} className="p-4 border rounded-xl text-center space-y-1">
                  <p className="text-base font-semibold">{g.region_name}</p>
                  <p className="text-3xl font-bold text-red-600">{formatPct(g.gap_percentage || 0)}</p>
                  <p className="text-sm text-muted-foreground">belum tercapai</p>
                  <Separator className="my-2" />
                  <p className="text-sm">Kemiskinan: {formatPct(g.poverty_rate || 0)}</p>
                  <p className="text-sm">IPM: {(g.ipm || 0).toFixed(1)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wakaf Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Data Wakaf Nasional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-3 text-center">
              <div className="p-5 bg-muted/50 rounded-xl">
                <p className="text-3xl font-bold">{formatNumber(d.wakafTotal.locations)}</p>
                <p className="text-sm text-muted-foreground mt-2">Total Lokasi</p>
              </div>
              <div className="p-5 bg-orange-50 rounded-xl">
                <p className="text-3xl font-bold text-orange-600">
                  {d.wakafTotal.locations > 0 ? formatPct((d.wakafTotal.productive / d.wakafTotal.locations) * 100) : "0%"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Sudah Produktif</p>
              </div>
              <div className="p-5 bg-muted/50 rounded-xl">
                <p className="text-3xl font-bold">{formatRupiah(d.wakafTotal.value)}</p>
                <p className="text-sm text-muted-foreground mt-2">Perkiraan Nilai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <p className="text-xl font-bold">Ingin data lebih lengkap dan rekomendasi penyaluran?</p>
            <p className="text-base text-muted-foreground">
              Daftarkan lembaga Anda untuk melihat rekomendasi daerah penyaluran dan laporan lengkap.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground rounded-xl text-base font-semibold hover:bg-primary/90"
            >
              Daftar Lembaga <ArrowRight className="size-5" />
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
