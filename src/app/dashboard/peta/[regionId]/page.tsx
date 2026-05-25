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
import { formatNumber, formatPct } from "@/lib/utils/format";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ regionId: string }>;
}

const ASNAF_CONFIG = [
  { key: "est_fakir", label: "Fakir", color: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  { key: "est_miskin", label: "Miskin", color: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  { key: "est_amil", label: "Amil", color: "bg-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" },
  { key: "est_mualaf", label: "Mualaf", color: "bg-lime-500", bg: "bg-lime-50", text: "text-lime-700" },
  { key: "est_riqab", label: "Riqab", color: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700" },
  { key: "est_gharimin", label: "Gharimin", color: "bg-cyan-500", bg: "bg-cyan-50", text: "text-cyan-700" },
  { key: "est_fisabilillah", label: "Fisabilillah", color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  { key: "est_ibnu_sabil", label: "Ibnu Sabil", color: "bg-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
];

async function getKecamatanData(regionId: string) {
  const supabase = await createClient();

  const { data: indicator } = await supabase
    .from("kecamatan_indicators")
    .select(`
      *,
      regions!inner(id, name, type, parent_id)
    `)
    .eq("region_id", regionId)
    .eq("year", 2024)
    .single();

  if (!indicator) return null;

  const region = indicator.regions as unknown as { id: string; name: string; type: string; parent_id: string };

  // Get parent (kabupaten) and grandparent (provinsi)
  let kabName = "";
  let provName = "";
  if (region?.parent_id) {
    const { data: kab } = await supabase
      .from("regions")
      .select("name, parent_id")
      .eq("id", region.parent_id)
      .single();
    if (kab) {
      kabName = kab.name;
      if (kab.parent_id) {
        const { data: prov } = await supabase
          .from("regions")
          .select("name")
          .eq("id", kab.parent_id)
          .single();
        if (prov) provName = prov.name;
      }
    }
  }

  // Get matching programs
  const { data: programs } = await supabase
    .from("program_templates")
    .select("name, target_asnaf, avg_cost_per_beneficiary, sector_id")
    .eq("is_active", true)
    .order("sort_order");

  return {
    indicator,
    region,
    kabName,
    provName,
    programs: programs || [],
  };
}

export default async function KecamatanDetailPage({ params }: Props) {
  const { regionId } = await params;
  const data = await getKecamatanData(regionId);

  if (!data) return notFound();

  const { indicator: k, region, kabName, provName, programs } = data;

  // Find top asnaf
  const asnafValues = ASNAF_CONFIG.map((a) => ({
    ...a,
    value: (k as Record<string, unknown>)[a.key] as number || 0,
  })).sort((a, b) => b.value - a.value);

  const totalAsnaf = asnafValues.reduce((s, a) => s + a.value, 0);

  // Match programs based on dominant asnaf
  const topAsnafKeys = asnafValues.slice(0, 3).map((a) => a.label.toLowerCase());
  const matchedPrograms = programs.filter((p) =>
    (p.target_asnaf as string[]).some((t) =>
      topAsnafKeys.some((k) => t.toLowerCase().includes(k))
    )
  );

  const priorityColor =
    (k.priority_score as number) >= 80 ? "text-red-600" :
    (k.priority_score as number) >= 60 ? "text-orange-600" :
    (k.priority_score as number) >= 40 ? "text-amber-600" : "text-green-600";

  const priorityLabel =
    (k.priority_score as number) >= 80 ? "Sangat Tinggi" :
    (k.priority_score as number) >= 60 ? "Tinggi" :
    (k.priority_score as number) >= 40 ? "Sedang" : "Rendah";

  return (
    <div className="flex flex-col">
      <PageHeader
        title={region.name}
        description={`${kabName}, ${provName}`}
      />

      <main className="flex-1 p-6 space-y-6">
        <Link href="/dashboard/peta" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Kembali ke Peta
        </Link>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-5 text-center">
              <p className={`text-2xl font-bold ${priorityColor}`}>{formatNumber(k.priority_score as number)}</p>
              <p className="text-sm text-muted-foreground mt-1">Skor Prioritas</p>
              <Badge variant="outline" className="mt-2 text-xs">{priorityLabel}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold">{formatNumber(k.population as number, true)}</p>
              <p className="text-sm text-muted-foreground mt-1">Populasi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold text-red-600">{formatPct(k.poverty_rate as number)}</p>
              <p className="text-sm text-muted-foreground mt-1">Kemiskinan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold">{formatNumber(k.ipm as number)}</p>
              <p className="text-sm text-muted-foreground mt-1">IPM</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold">{formatNumber(Math.round((k.ziswaf_per_capita as number) || 0))}</p>
              <p className="text-sm text-muted-foreground mt-1">ZISWAF/Kapita (Rp)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold">{formatNumber(k.coverage_gap_score as number)}</p>
              <p className="text-sm text-muted-foreground mt-1">Gap Score</p>
            </CardContent>
          </Card>
        </div>

        {/* 8 Asnaf Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Estimasi 8 Asnaf</CardTitle>
            <CardDescription className="text-sm">
              Total estimasi: {formatNumber(totalAsnaf, true)} jiwa yang memenuhi kriteria asnaf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {asnafValues.map((a) => {
                const pct = totalAsnaf > 0 ? (a.value / totalAsnaf) * 100 : 0;
                return (
                  <div key={a.key} className={`${a.bg} rounded-xl p-4 space-y-2`}>
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold text-sm ${a.text}`}>{a.label}</p>
                      <Badge variant="outline" className="text-xs">{formatPct(pct)}</Badge>
                    </div>
                    <p className={`text-2xl font-bold ${a.text}`}>{formatNumber(a.value, true)}</p>
                    <div className="w-full bg-white/60 rounded-full h-2">
                      <div className={`${a.color} rounded-full h-2`} style={{ width: `${Math.min(pct * 2, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Programs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Program yang Direkomendasikan</CardTitle>
            <CardDescription className="text-sm">
              Berdasarkan profil asnaf dominan: {topAsnafKeys.join(", ")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchedPrograms.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada program yang cocok ditemukan.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedPrograms.map((p) => (
                  <div key={p.name} className="p-4 border rounded-xl space-y-2">
                    <p className="font-semibold text-base">{p.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.target_asnaf as string[]).map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Biaya per penerima: Rp {(p.avg_cost_per_beneficiary || 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
