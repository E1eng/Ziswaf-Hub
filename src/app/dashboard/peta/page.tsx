import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";
import { MapPin, Users, TrendingDown, AlertTriangle } from "lucide-react";
import { IndonesiaMap } from "@/components/maps/indonesia-map";

interface ProvinceStats {
  provinsi_id: string;
  provinsi_name: string;
  lat: number;
  lon: number;
  total_kecamatan: number;
  total_population: number;
  avg_poverty_rate: number;
  avg_priority_score: number;
  total_fakir: number;
  total_miskin: number;
  total_gharimin: number;
  avg_coverage_gap: number;
  total_ziswaf_received: number;
}

async function getMapData(): Promise<ProvinceStats[]> {
  const supabase = await createClient();

  // Get all kecamatan indicators with their hierarchy
  const { data: kecData } = await supabase
    .from("kecamatan_indicators")
    .select(
      `
      region_id,
      population,
      poverty_rate,
      priority_score,
      est_fakir,
      est_miskin,
      est_gharimin,
      coverage_gap_score,
      total_ziswaf_received,
      regions!inner (
        id,
        name,
        parent_id
      )
    `
    )
    .eq("year", 2024);

  if (!kecData || kecData.length === 0) return [];

  // Get kabupaten → provinsi mapping
  const kecRegions = kecData.map((k) => k.regions as unknown as { id: string; name: string; parent_id: string });
  const kabIds = [...new Set(kecRegions.map((r) => r.parent_id).filter(Boolean))];

  const { data: kabData } = await supabase
    .from("regions")
    .select("id, name, parent_id")
    .in("id", kabIds);

  const kabMap = new Map(
    (kabData || []).map((r) => [r.id, r])
  );

  // Get province names
  const provIds = [...new Set((kabData || []).map((r) => r.parent_id).filter((x): x is string => !!x))];
  const { data: provData } = await supabase
    .from("regions")
    .select("id, name, latitude, longitude")
    .in("id", provIds);

  const provMap = new Map(
    (provData || []).map((r) => [r.id, { name: r.name, lat: Number(r.latitude ?? 0), lon: Number(r.longitude ?? 0) }])
  );

  // Aggregate by province
  const provStats = new Map<string, ProvinceStats>();

  for (const kec of kecData) {
    const region = kec.regions as unknown as { id: string; name: string; parent_id: string };
    const kab = kabMap.get(region.parent_id);
    if (!kab) continue;
    const provId = kab.parent_id;
    if (!provId) continue;

    const provInfo = provMap.get(provId);
    const existing = provStats.get(provId) || {
      provinsi_id: provId,
      provinsi_name: provInfo?.name || "",
      lat: provInfo?.lat || 0,
      lon: provInfo?.lon || 0,
      total_kecamatan: 0,
      total_population: 0,
      avg_poverty_rate: 0,
      avg_priority_score: 0,
      total_fakir: 0,
      total_miskin: 0,
      total_gharimin: 0,
      avg_coverage_gap: 0,
      total_ziswaf_received: 0,
    };

    existing.total_kecamatan += 1;
    existing.total_population += kec.population || 0;
    existing.avg_poverty_rate += kec.poverty_rate || 0;
    existing.avg_priority_score += kec.priority_score || 0;
    existing.total_fakir += kec.est_fakir || 0;
    existing.total_miskin += kec.est_miskin || 0;
    existing.total_gharimin += kec.est_gharimin || 0;
    existing.avg_coverage_gap += kec.coverage_gap_score || 0;
    existing.total_ziswaf_received += kec.total_ziswaf_received || 0;

    provStats.set(provId, existing);
  }

  // Calculate averages
  const results = Array.from(provStats.values()).map((p) => ({
    ...p,
    avg_poverty_rate: p.total_kecamatan > 0 ? p.avg_poverty_rate / p.total_kecamatan : 0,
    avg_priority_score: p.total_kecamatan > 0 ? p.avg_priority_score / p.total_kecamatan : 0,
    avg_coverage_gap: p.total_kecamatan > 0 ? p.avg_coverage_gap / p.total_kecamatan : 0,
  }));

  return results.sort((a, b) => b.avg_priority_score - a.avg_priority_score);
}

export default async function PetaPage() {
  const provinces = await getMapData();

  const totalKec = provinces.reduce((s, p) => s + p.total_kecamatan, 0);
  const totalPop = provinces.reduce((s, p) => s + p.total_population, 0);
  const totalFakir = provinces.reduce((s, p) => s + p.total_fakir, 0);
  const totalMiskin = provinces.reduce((s, p) => s + p.total_miskin, 0);

  return (
    <>
      <PageHeader
        title="Peta Kecamatan"
        description="Data indikator per kecamatan se-Indonesia"
      />
      <div className="p-6 space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <MapPin className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Kecamatan</p>
                  <p className="text-2xl font-bold">{formatNumber(totalKec)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <Users className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Penduduk</p>
                  <p className="text-2xl font-bold">{formatNumber(totalPop, true)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-500/10">
                  <TrendingDown className="size-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimasi Fakir</p>
                  <p className="text-2xl font-bold">{formatNumber(totalFakir, true)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-orange-500/10">
                  <AlertTriangle className="size-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimasi Miskin</p>
                  <p className="text-2xl font-bold">{formatNumber(totalMiskin, true)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Peta Prioritas Penyaluran</CardTitle>
            <CardDescription>
              Warna = skor prioritas (merah = sangat butuh), ukuran = jumlah penduduk. Hover untuk detail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IndonesiaMap
              provinces={provinces.map((p) => ({
                name: p.provinsi_name,
                lat: p.lat,
                lon: p.lon,
                total_kecamatan: p.total_kecamatan,
                total_population: p.total_population,
                avg_poverty_rate: p.avg_poverty_rate,
                avg_priority_score: p.avg_priority_score,
                total_fakir: p.total_fakir,
                total_miskin: p.total_miskin,
                avg_coverage_gap: p.avg_coverage_gap,
                total_ziswaf_received: p.total_ziswaf_received,
              }))}
            />
          </CardContent>
        </Card>

        {/* Province Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ringkasan per Provinsi</CardTitle>
            <CardDescription>
              Diurutkan berdasarkan skor prioritas (tertinggi = paling membutuhkan bantuan)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Provinsi</TableHead>
                    <TableHead className="text-right">Kecamatan</TableHead>
                    <TableHead className="text-right">Penduduk</TableHead>
                    <TableHead className="text-right">Kemiskinan</TableHead>
                    <TableHead className="text-right">Skor Prioritas</TableHead>
                    <TableHead className="text-right">Gap Coverage</TableHead>
                    <TableHead className="text-right">Fakir</TableHead>
                    <TableHead className="text-right">Miskin</TableHead>
                    <TableHead className="text-right">ZISWAF Diterima</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provinces.map((prov, idx) => (
                    <TableRow key={prov.provinsi_id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-semibold">{prov.provinsi_name}</TableCell>
                      <TableCell className="text-right">{prov.total_kecamatan}</TableCell>
                      <TableCell className="text-right">{formatNumber(prov.total_population, true)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={prov.avg_poverty_rate >= 15 ? "destructive" : prov.avg_poverty_rate >= 10 ? "default" : "secondary"}>
                          {formatPct(prov.avg_poverty_rate)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={prov.avg_priority_score >= 20 ? "destructive" : prov.avg_priority_score >= 15 ? "default" : "secondary"}>
                          {prov.avg_priority_score.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{prov.avg_coverage_gap.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{formatNumber(prov.total_fakir, true)}</TableCell>
                      <TableCell className="text-right">{formatNumber(prov.total_miskin, true)}</TableCell>
                      <TableCell className="text-right">{formatRupiah(prov.total_ziswaf_received)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
