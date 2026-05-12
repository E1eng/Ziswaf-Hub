import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";
import { Target, AlertTriangle, ArrowRight, CheckCircle } from "lucide-react";

interface RegionScore {
  region_id: string;
  region_name: string;
  poverty_rate: number;
  poverty_count: number;
  population: number;
  ipm: number;
  gap_percentage: number;
  existing_distribution: number;
  existing_beneficiaries: number;
  dist_per_poor: number;
  priority_score: number;
  priority_level: "sangat_tinggi" | "tinggi" | "sedang" | "rendah";
  recommendation: string;
}

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v) => ((v - min) / range) * 100);
}

async function getTargetingData() {
  const supabase = await createClient();
  const year = 2024;

  const [{ data: gapRows }, { data: distRows }] = await Promise.all([
    supabase.from("mv_gap_analysis").select("*").eq("year", year),
    supabase.from("mv_distribution_by_region_year")
      .select("region_id, total_amount, total_beneficiaries")
      .eq("year", year),
  ]);

  // Aggregate distribution per region
  const distMap = new Map<string, { amount: number; beneficiaries: number }>();
  for (const d of distRows || []) {
    const prev = distMap.get(d.region_id || "") || { amount: 0, beneficiaries: 0 };
    distMap.set(d.region_id || "", {
      amount: prev.amount + (d.total_amount || 0),
      beneficiaries: prev.beneficiaries + (d.total_beneficiaries || 0),
    });
  }

  const provinces = (gapRows || []).map((g) => {
    const dist = distMap.get(g.region_id || "") || { amount: 0, beneficiaries: 0 };
    const povertyCount = Math.round(((g.poverty_rate || 0) / 100) * (g.population || 0));
    return {
      region_id: g.region_id || "",
      region_name: g.region_name || "",
      poverty_rate: g.poverty_rate || 0,
      poverty_count: povertyCount,
      population: g.population || 0,
      ipm: g.ipm || 0,
      gap_percentage: g.gap_percentage || 0,
      existing_distribution: dist.amount,
      existing_beneficiaries: dist.beneficiaries,
      dist_per_poor: povertyCount > 0 ? dist.amount / povertyCount : 0,
    };
  });

  // Calculate priority score
  // High poverty + low dist per poor + high gap + low IPM = high priority
  const povertyNorm = normalize(provinces.map((p) => p.poverty_rate));
  const gapNorm = normalize(provinces.map((p) => p.gap_percentage));
  const ipmInverse = normalize(provinces.map((p) => 100 - p.ipm));
  const distNorm = normalize(provinces.map((p) => p.dist_per_poor));

  const ranked: RegionScore[] = provinces.map((p, i) => {
    const score = Math.round(
      (povertyNorm[i] * 0.35 + (100 - distNorm[i]) * 0.30 + gapNorm[i] * 0.20 + ipmInverse[i] * 0.15) * 10
    ) / 10;

    let level: RegionScore["priority_level"];
    let recommendation: string;

    if (score >= 75) {
      level = "sangat_tinggi";
      recommendation = `Prioritas utama penyaluran. Fokus pada program bantuan langsung (fakir/miskin) dan pemberdayaan ekonomi.`;
    } else if (score >= 55) {
      level = "tinggi";
      recommendation = `Perlu peningkatan penyaluran. Pertimbangkan program pendidikan dan kesehatan untuk dampak jangka panjang.`;
    } else if (score >= 35) {
      level = "sedang";
      recommendation = `Distribusi cukup, fokus pada pendayagunaan (program produktif) daripada bantuan konsumtif.`;
    } else {
      level = "rendah";
      recommendation = `Coverage sudah baik. Optimalkan program existing dan tingkatkan pendayagunaan.`;
    }

    return { ...p, priority_score: score, priority_level: level, recommendation };
  }).sort((a, b) => b.priority_score - a.priority_score);

  const sangatTinggi = ranked.filter((r) => r.priority_level === "sangat_tinggi");
  const tinggi = ranked.filter((r) => r.priority_level === "tinggi");

  return { ranked, sangatTinggiCount: sangatTinggi.length, tinggiCount: tinggi.length };
}

const levelConfig = {
  sangat_tinggi: { color: "text-red-700", bg: "bg-red-50", badge: "destructive" as const, label: "Sangat Tinggi" },
  tinggi: { color: "text-orange-700", bg: "bg-orange-50", badge: "destructive" as const, label: "Tinggi" },
  sedang: { color: "text-yellow-700", bg: "bg-yellow-50", badge: "secondary" as const, label: "Sedang" },
  rendah: { color: "text-green-700", bg: "bg-green-50", badge: "outline" as const, label: "Rendah" },
};

export default async function TargetingPage() {
  const data = await getTargetingData();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Targeting Penyaluran"
        description="Rekomendasi daerah prioritas berdasarkan data kemiskinan, gap zakat, dan penyaluran existing"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="size-8 mx-auto text-red-600 mb-2" />
              <p className="text-3xl font-bold text-red-600">{data.sangatTinggiCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Provinsi Prioritas Sangat Tinggi</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardContent className="pt-6 text-center">
              <Target className="size-8 mx-auto text-orange-600 mb-2" />
              <p className="text-3xl font-bold text-orange-600">{data.tinggiCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Provinsi Prioritas Tinggi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="size-8 mx-auto text-green-600 mb-2" />
              <p className="text-3xl font-bold">{data.ranked.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Provinsi Dianalisis</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="size-5 text-primary" />
              <CardTitle>Rekomendasi Penyaluran</CardTitle>
            </div>
            <CardDescription>
              Daerah berikut memiliki kebutuhan tertinggi namun penyaluran masih rendah — prioritaskan penyaluran ke sini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.ranked.filter((r) => r.priority_level === "sangat_tinggi" || r.priority_level === "tinggi").slice(0, 7).map((region, idx) => {
                const cfg = levelConfig[region.priority_level];
                return (
                  <div key={region.region_id} className={`p-4 rounded-lg border ${cfg.bg} dark:bg-transparent`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold text-muted-foreground mt-0.5">{idx + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{region.region_name}</h4>
                            <Badge variant={cfg.badge} className="text-[10px]">
                              Skor {region.priority_score}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Kemiskinan: <strong>{formatPct(region.poverty_rate)}</strong></span>
                            <span>Penduduk miskin: <strong>{formatNumber(region.poverty_count)}</strong></span>
                            <span>Gap: <strong>{formatPct(region.gap_percentage)}</strong></span>
                            <span>IPM: <strong>{region.ipm.toFixed(1)}</strong></span>
                          </div>
                          <div className="flex items-start gap-2 mt-2">
                            <ArrowRight className="size-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-sm text-muted-foreground">{region.recommendation}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xs text-muted-foreground">Existing</p>
                        <p className="text-sm font-medium">{formatRupiah(region.existing_distribution)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatRupiah(Math.round(region.dist_per_poor))}/miskin
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Methodology */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bagaimana Skor Prioritas Dihitung?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { weight: "35%", name: "Kemiskinan", desc: "Tingkat kemiskinan provinsi" },
                { weight: "30%", name: "Kekurangan Distribusi", desc: "Penyaluran per kapita penduduk miskin (rendah = butuh lebih)" },
                { weight: "20%", name: "Gap Zakat", desc: "Potensi zakat yang belum terealisasi" },
                { weight: "15%", name: "IPM Rendah", desc: "Daerah IPM rendah lebih butuh bantuan" },
              ].map((c) => (
                <div key={c.name} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px]">{c.weight}</Badge>
                    <span className="text-xs font-medium">{c.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Full Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking Seluruh Provinsi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Provinsi</TableHead>
                  <TableHead className="text-center">Prioritas</TableHead>
                  <TableHead className="text-right">Kemiskinan</TableHead>
                  <TableHead className="text-right">Penduduk Miskin</TableHead>
                  <TableHead className="text-right">Distribusi/Miskin</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ranked.map((r, idx) => {
                  const cfg = levelConfig[r.priority_level];
                  return (
                    <TableRow key={r.region_id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{r.region_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cfg.badge} className="text-[10px]">{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatPct(r.poverty_rate)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.poverty_count)}</TableCell>
                      <TableCell className="text-right">{formatRupiah(Math.round(r.dist_per_poor))}</TableCell>
                      <TableCell className="text-right">{formatPct(r.gap_percentage)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
