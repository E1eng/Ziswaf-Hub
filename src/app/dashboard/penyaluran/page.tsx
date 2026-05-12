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
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";

async function getDistributionData() {
  const supabase = await createClient();

  const [{ data: byRegion }, { data: bySector }] = await Promise.all([
    supabase
      .from("mv_distribution_by_region_year")
      .select("region_name, region_type, sector_name, total_amount, total_beneficiaries, distribution_type")
      .eq("year", 2024)
      .eq("region_type", "provinsi"),
    supabase
      .from("mv_distribution_by_region_year")
      .select("sector_name, sector_code, total_amount, total_beneficiaries, distribution_type")
      .eq("year", 2024),
  ]);

  // Aggregate by province
  const provMap = new Map<string, { amount: number; beneficiaries: number }>();
  for (const r of byRegion || []) {
    const prev = provMap.get(r.region_name || "") || { amount: 0, beneficiaries: 0 };
    provMap.set(r.region_name || "", {
      amount: prev.amount + (r.total_amount || 0),
      beneficiaries: prev.beneficiaries + (r.total_beneficiaries || 0),
    });
  }
  const provinces = Array.from(provMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount);

  // Aggregate by sector
  const sectorMap = new Map<string, { amount: number; beneficiaries: number; type: string }>();
  for (const r of bySector || []) {
    const prev = sectorMap.get(r.sector_name || "") || { amount: 0, beneficiaries: 0, type: "" };
    sectorMap.set(r.sector_name || "", {
      amount: prev.amount + (r.total_amount || 0),
      beneficiaries: prev.beneficiaries + (r.total_beneficiaries || 0),
      type: r.distribution_type || prev.type,
    });
  }
  const sectors = Array.from(sectorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount);

  const totalAmount = provinces.reduce((s, r) => s + r.amount, 0);
  const totalBeneficiaries = provinces.reduce((s, r) => s + r.beneficiaries, 0);

  // Pendayagunaan vs Pendistribusian
  let dayaguna = 0;
  let distribusi = 0;
  for (const r of bySector || []) {
    if (r.distribution_type === "pendayagunaan") dayaguna += r.total_amount || 0;
    else distribusi += r.total_amount || 0;
  }

  return { provinces, sectors, totalAmount, totalBeneficiaries, dayaguna, distribusi };
}

export default async function PenyaluranPage() {
  const data = await getDistributionData();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Penyaluran"
        description="Data penyaluran ZIS-DSKL per sektor dan provinsi"
      />

      <main className="flex-1 p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Penyaluran 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(data.totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Penerima Manfaat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.totalBeneficiaries, true)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendayagunaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(data.dayaguna)}</div>
              <p className="text-xs text-muted-foreground mt-1">Program produktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendistribusian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(data.distribusi)}</div>
              <p className="text-xs text-muted-foreground mt-1">Program kuratif/konsumtif</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Penyaluran per Sektor</CardTitle>
              <CardDescription>7 bidang penyaluran ZISWAF</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.sectors.map((sector) => {
                  const pct = data.totalAmount > 0 ? (sector.amount / data.totalAmount) * 100 : 0;
                  return (
                    <div key={sector.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{sector.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">{sector.type || "-"}</Badge>
                        </div>
                        <span className="text-sm font-semibold">{formatPct(pct)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatRupiah(sector.amount)}</span>
                        <span>{formatNumber(sector.beneficiaries)} penerima</span>
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

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Provinsi Penyaluran</CardTitle>
              <CardDescription>Daerah dengan penyaluran terbesar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.provinces.slice(0, 10).map((prov, idx) => {
                  const pct = data.totalAmount > 0 ? (prov.amount / data.totalAmount) * 100 : 0;
                  return (
                    <div key={prov.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{prov.name}</span>
                          <span className="text-xs text-muted-foreground">{formatRupiah(prov.amount)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1 mt-1">
                          <div className="bg-primary rounded-full h-1" style={{ width: `${pct * 3}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detail Penyaluran per Provinsi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Provinsi</TableHead>
                  <TableHead className="text-right">Total Penyaluran</TableHead>
                  <TableHead className="text-right">Penerima Manfaat</TableHead>
                  <TableHead className="text-right">Rata-rata/Penerima</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.provinces.map((prov, idx) => (
                  <TableRow key={prov.name}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{prov.name}</TableCell>
                    <TableCell className="text-right">{formatRupiah(prov.amount)}</TableCell>
                    <TableCell className="text-right">{formatNumber(prov.beneficiaries)}</TableCell>
                    <TableCell className="text-right">
                      {prov.beneficiaries > 0 ? formatRupiah(prov.amount / prov.beneficiaries) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
