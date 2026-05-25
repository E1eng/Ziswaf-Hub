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
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";

async function getCollectionData() {
  const supabase = await createClient();

  const [{ data: byRegion }, { data: byCategory }, { data: monthly }] = await Promise.all([
    supabase
      .from("mv_collection_by_region_year")
      .select("region_name, region_type, total_amount, total_donors, record_count, ziswaf_category")
      .eq("year", 2024)
      .eq("region_type", "provinsi"),
    supabase
      .from("mv_collection_by_region_year")
      .select("ziswaf_category, total_amount, total_donors")
      .eq("year", 2024),
    supabase
      .from("mv_collection_monthly_trend")
      .select("year, month, total_amount, total_donors")
      .in("year", [2023, 2024])
      .order("year")
      .order("month"),
  ]);

  // Aggregate by province
  const provMap = new Map<string, { amount: number; donors: number }>();
  for (const r of byRegion || []) {
    const prev = provMap.get(r.region_name || "") || { amount: 0, donors: 0 };
    provMap.set(r.region_name || "", {
      amount: prev.amount + (r.total_amount || 0),
      donors: prev.donors + (r.total_donors || 0),
    });
  }
  const provinces = Array.from(provMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount);

  // Aggregate by ZISWAF category
  const catMap = new Map<string, { amount: number; donors: number }>();
  for (const r of byCategory || []) {
    const prev = catMap.get(r.ziswaf_category || "") || { amount: 0, donors: 0 };
    catMap.set(r.ziswaf_category || "", {
      amount: prev.amount + (r.total_amount || 0),
      donors: prev.donors + (r.total_donors || 0),
    });
  }
  const categories = Array.from(catMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount);

  const totalAmount = provinces.reduce((s, r) => s + r.amount, 0);
  const totalDonors = provinces.reduce((s, r) => s + r.donors, 0);

  return { provinces, categories, monthly: monthly || [], totalAmount, totalDonors };
}

export default async function PengumpulanPage() {
  const data = await getCollectionData();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pengumpulan"
        description="Data pengumpulan ZIS-DSKL per provinsi dan kategori"
      />

      <main className="flex-1 p-6 space-y-8">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengumpulan 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatRupiah(data.totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Donatur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(data.totalDonors, true)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jumlah Provinsi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.provinces.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Per Kategori ZISWAF</CardTitle>
              <CardDescription className="text-sm">Pembagian pengumpulan per jenis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.categories.slice(0, 10).map((cat) => {
                  const pct = data.totalAmount > 0 ? (cat.amount / data.totalAmount) * 100 : 0;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base truncate max-w-[200px]">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{formatRupiah(cat.amount)}</span>
                          <Badge variant="secondary" className="text-sm">{formatPct(pct)}</Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary rounded-full h-2.5" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Tren Bulanan</CardTitle>
              <CardDescription className="text-sm">Perbandingan pengumpulan bulanan 2023 vs 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyTrendChart data={data.monthly} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pengumpulan per Provinsi</CardTitle>
            <CardDescription className="text-sm">Diurutkan berdasarkan total pengumpulan terbesar</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Provinsi</TableHead>
                  <TableHead className="text-right">Total Pengumpulan</TableHead>
                  <TableHead className="text-right">Jumlah Donatur</TableHead>
                  <TableHead className="text-right">Kontribusi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.provinces.map((prov, idx) => {
                  const pct = data.totalAmount > 0 ? (prov.amount / data.totalAmount) * 100 : 0;
                  return (
                    <TableRow key={prov.name}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{prov.name}</TableCell>
                      <TableCell className="text-right">{formatRupiah(prov.amount)}</TableCell>
                      <TableCell className="text-right">{formatNumber(prov.donors)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{formatPct(pct)}</Badge>
                      </TableCell>
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
