"use client";

import { useState, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  MapPin,
  Users,
  DollarSign,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Target,
  TrendingUp,
  Send,
  Download,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  approveAndDisburse,
  checkBalance,
  triggerCSVDownload,
  type FundType,
  type DisbursementResult,
} from "@/lib/disbursement";

interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  target_asnaf: string[];
  avg_cost_per_beneficiary: number;
  min_budget: number;
  duration_months: number;
  sector_id: string;
}

interface ProvinceOption {
  id: string;
  name: string;
}

interface AllocationResult {
  region_id: string;
  kecamatan_name: string;
  kabupaten_name: string;
  provinsi_name: string;
  priority_score: number;
  poverty_rate: number;
  coverage_gap_score: number;
  population: number;
  est_fakir: number;
  est_miskin: number;
  est_gharimin: number;
  est_fisabilillah: number;
  est_ibnu_sabil: number;
  allocated_amount: number;
  est_beneficiaries: number;
  program_name: string;
}

interface AllocationSummary {
  total_budget: number;
  total_allocated: number;
  total_kecamatan: number;
  total_beneficiaries: number;
  items: AllocationResult[];
}

const ASNAF_LABELS: Record<string, string> = {
  fakir: "Fakir",
  miskin: "Miskin",
  mualaf: "Mualaf",
  riqab: "Riqab",
  gharimin: "Gharimin",
  fisabilillah: "Fisabilillah",
  ibnu_sabil: "Ibnu Sabil",
};

interface Props {
  programs: ProgramTemplate[];
  provinces: ProvinceOption[];
}

export function AllocationWizard({ programs, provinces }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AllocationSummary | null>(null);

  // Disbursement state
  const [fundType, setFundType] = useState<FundType>("ZAKAT");
  const [disbursing, setDisbursing] = useState(false);
  const [disbursementResult, setDisbursementResult] = useState<DisbursementResult | null>(null);
  const [balanceInfo, setBalanceInfo] = useState<{ sufficient: boolean; current_balance: number } | null>(null);

  // Form state
  const [budget, setBudget] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [maxKecamatan, setMaxKecamatan] = useState("20");

  const selectedProgramData = programs.find((p) => p.id === selectedProgram);

  const canCalculate =
    budget && parseInt(budget) > 0 && selectedProgram && maxKecamatan;

  const handleCalculate = useCallback(async () => {
    if (!canCalculate || !selectedProgramData) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const budgetNum = parseInt(budget);
      const maxKec = parseInt(maxKecamatan);

      // Fetch top kecamatan by priority score
      let query = supabase
        .from("kecamatan_indicators")
        .select(
          `
          region_id,
          priority_score,
          poverty_rate,
          coverage_gap_score,
          population,
          est_fakir,
          est_miskin,
          est_gharimin,
          est_fisabilillah,
          est_ibnu_sabil,
          est_mualaf,
          regions!inner (
            id,
            name,
            parent_id,
            type
          )
        `
        )
        .eq("year", 2024)
        .order("priority_score", { ascending: false })
        .limit(maxKec * 3); // fetch extra to filter

      // Province filter — needs to check grandparent
      // We'll filter client-side if province is selected

      const { data: kecData, error } = await query;

      if (error) {
        console.error("Query error:", error);
        setLoading(false);
        return;
      }

      // If province selected, we need to resolve the hierarchy
      let filteredData = kecData || [];
      if (selectedProvince !== "all") {
        // Get kabupaten IDs for this province
        const { data: kabData } = await supabase
          .from("regions")
          .select("id")
          .eq("parent_id", selectedProvince)
          .in("type", ["kabupaten", "kota"]);

        const kabIds = new Set((kabData || []).map((k: { id: string }) => k.id));

        filteredData = filteredData.filter((k: Record<string, unknown>) => {
          const region = k.regions as Record<string, unknown>;
          return region && kabIds.has(region.parent_id as string);
        });
      }

      // Take top N by priority
      const topKecamatan = filteredData.slice(0, maxKec);

      // Fetch parent names (kabupaten + provinsi)
      const parentIds = [
        ...new Set(
          topKecamatan.map((k: Record<string, unknown>) => {
            const region = k.regions as Record<string, unknown>;
            return region?.parent_id as string;
          }).filter(Boolean)
        ),
      ];

      const { data: parentRegions } = await supabase
        .from("regions")
        .select("id, name, parent_id")
        .in("id", parentIds);

      const parentMap = new Map(
        (parentRegions || []).map((r: { id: string; name: string; parent_id: string | null }) => [r.id, r])
      );

      // Get province names
      const provIds = [
        ...new Set(
          (parentRegions || []).map((r: { parent_id: string | null }) => r.parent_id).filter((x): x is string => !!x)
        ),
      ];
      const { data: provRegions } = await supabase
        .from("regions")
        .select("id, name")
        .in("id", provIds);
      const provMap = new Map(
        (provRegions || []).map((r: { id: string; name: string }) => [r.id, r.name])
      );

      // Allocate budget proportionally by priority score
      const totalPriority = topKecamatan.reduce(
        (sum: number, k: Record<string, unknown>) => sum + (k.priority_score as number),
        0
      );

      const costPerBenef = selectedProgramData.avg_cost_per_beneficiary;
      let totalAllocated = 0;
      let totalBeneficiaries = 0;

      const items: AllocationResult[] = topKecamatan.map(
        (k: Record<string, unknown>, idx: number) => {
          const region = k.regions as Record<string, unknown>;
          const parent = parentMap.get(region?.parent_id as string) as { name: string; parent_id: string } | undefined;
          const provName = parent
            ? provMap.get(parent.parent_id) || ""
            : "";

          // Proportional allocation by priority
          const share = (k.priority_score as number) / totalPriority;
          const allocated = Math.min(
            Math.round(budgetNum * share),
            budgetNum - totalAllocated
          );
          const beneficiaries = Math.floor(allocated / costPerBenef);

          totalAllocated += allocated;
          totalBeneficiaries += beneficiaries;

          return {
            region_id: k.region_id as string,
            kecamatan_name: (region?.name as string) || "",
            kabupaten_name: parent?.name || "",
            provinsi_name: provName as string,
            priority_score: k.priority_score as number,
            poverty_rate: k.poverty_rate as number,
            coverage_gap_score: k.coverage_gap_score as number,
            population: k.population as number,
            est_fakir: k.est_fakir as number,
            est_miskin: k.est_miskin as number,
            est_gharimin: k.est_gharimin as number,
            est_fisabilillah: k.est_fisabilillah as number,
            est_ibnu_sabil: k.est_ibnu_sabil as number,
            allocated_amount: allocated,
            est_beneficiaries: beneficiaries,
            program_name: selectedProgramData.name,
          };
        }
      );

      setResult({
        total_budget: budgetNum,
        total_allocated: totalAllocated,
        total_kecamatan: items.length,
        total_beneficiaries: totalBeneficiaries,
        items,
      });
      setStep(3);
    } catch (err) {
      console.error("Allocation error:", err);
    } finally {
      setLoading(false);
    }
  }, [budget, selectedProgram, selectedProvince, maxKecamatan, canCalculate, selectedProgramData]);

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            step >= 1
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span className="font-semibold">1</span>
          <span>Masukkan Anggaran</span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            step >= 2
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span className="font-semibold">2</span>
          <span>Pilih Program</span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            step >= 3
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span className="font-semibold">3</span>
          <span>Hasil Alokasi</span>
        </div>
      </div>

      {/* Step 1 + 2: Input Form */}
      {step < 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <DollarSign className="size-5 text-primary" />
                Anggaran Penyaluran
              </CardTitle>
              <CardDescription>
                Masukkan total dana yang akan disalurkan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">Total Anggaran (Rupiah)</Label>
                <Input
                  type="number"
                  placeholder="Contoh: 1000000000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="text-lg h-12"
                />
                {budget && parseInt(budget) > 0 && (
                  <p className="text-base font-semibold text-primary">
                    = {formatRupiah(parseInt(budget))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-base">Filter Provinsi (opsional)</Label>
                <Select
                  value={selectedProvince}
                  onValueChange={(v) => v && setSelectedProvince(v)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Semua Provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Provinsi</SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base">
                  Jumlah Kecamatan Sasaran (maks)
                </Label>
                <Input
                  type="number"
                  value={maxKecamatan}
                  onChange={(e) => setMaxKecamatan(e.target.value)}
                  className="h-11"
                  min={1}
                  max={100}
                />
              </div>
            </CardContent>
          </Card>

          {/* Program Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="size-5 text-primary" />
                Pilih Program
              </CardTitle>
              <CardDescription>
                Pilih jenis program penyaluran
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {programs.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProgram === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedProgram(p.id);
                    setStep(2);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-base">{p.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {p.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.target_asnaf.map((a) => (
                          <Badge
                            key={a}
                            variant="secondary"
                            className="text-xs"
                          >
                            {ASNAF_LABELS[a] || a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-muted-foreground">
                        Biaya / penerima
                      </p>
                      <p className="font-bold text-base text-primary">
                        {formatRupiah(p.avg_cost_per_beneficiary)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculate Button */}
      {step < 3 && (
        <div className="flex justify-center">
          <Button
            size="lg"
            className="px-8 h-12 text-base"
            disabled={!canCalculate || loading}
            onClick={handleCalculate}
          >
            {loading ? (
              <>
                <Loader2 className="size-5 mr-2 animate-spin" />
                Menghitung Alokasi...
              </>
            ) : (
              <>
                <Calculator className="size-5 mr-2" />
                Hitung Alokasi Optimal
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <DollarSign className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Alokasi
                    </p>
                    <p className="text-xl font-bold">
                      {formatRupiah(result.total_allocated)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/10">
                    <MapPin className="size-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Kecamatan Sasaran
                    </p>
                    <p className="text-xl font-bold">
                      {result.total_kecamatan} kecamatan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10">
                    <Users className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Estimasi Penerima
                    </p>
                    <p className="text-xl font-bold">
                      {formatNumber(result.total_beneficiaries)} orang
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/10">
                    <TrendingUp className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="text-xl font-bold">
                      {selectedProgramData?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Rencana Alokasi per Kecamatan
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Diurutkan berdasarkan skor prioritas (tertinggi = paling
                    membutuhkan)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!result || !selectedProgramData) return;
                      const supabase = createClient();
                      const { data: inst } = await supabase
                        .from("institutions")
                        .select("id")
                        .limit(1)
                        .single();
                      if (!inst) return;

                      const planName = `${selectedProgramData.name} — ${result.total_kecamatan} kecamatan`;
                      const { data: plan } = await supabase
                        .from("allocation_plans")
                        .insert({
                          institution_id: inst.id,
                          name: planName,
                          total_budget: result.total_budget,
                          total_kecamatan: result.total_kecamatan,
                          total_est_beneficiaries: result.total_beneficiaries,
                          total_programs: 1,
                          year: new Date().getFullYear(),
                          status: "draft",
                        })
                        .select("id")
                        .single();

                      if (plan) {
                        const items = result.items.map((item, idx) => ({
                          plan_id: plan.id,
                          region_id: item.region_id,
                          program_template_id: selectedProgramData.id,
                          allocated_amount: item.allocated_amount,
                          est_beneficiaries: item.est_beneficiaries,
                          priority_rank: idx + 1,
                        }));
                        await supabase.from("allocation_plan_items").insert(items);
                        toast.success("Rencana alokasi berhasil disimpan!", {
                          description: `${result.total_kecamatan} kecamatan, ${formatRupiah(result.total_budget)}`,
                        });
                      }
                    }}
                  >
                    <CheckCircle className="size-4 mr-1" />
                    Simpan Rencana
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setResult(null);
                    }}
                  >
                    Hitung Ulang
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Kecamatan</TableHead>
                      <TableHead>Kabupaten/Kota</TableHead>
                      <TableHead>Provinsi</TableHead>
                      <TableHead className="text-right">Skor</TableHead>
                      <TableHead className="text-right">Kemiskinan</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                      <TableHead className="text-right">Alokasi</TableHead>
                      <TableHead className="text-right">
                        Est. Penerima
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.items.map((item, idx) => (
                      <TableRow key={item.region_id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-semibold">
                          {item.kecamatan_name}
                        </TableCell>
                        <TableCell>{item.kabupaten_name}</TableCell>
                        <TableCell>{item.provinsi_name}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              item.priority_score >= 25
                                ? "destructive"
                                : item.priority_score >= 15
                                ? "default"
                                : "secondary"
                            }
                          >
                            {item.priority_score.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPct(item.poverty_rate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.coverage_gap_score.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatRupiah(item.allocated_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.est_beneficiaries)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Asnaf Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Estimasi Penerima per Kategori Asnaf
              </CardTitle>
              <CardDescription>
                Total estimasi di {result.total_kecamatan} kecamatan sasaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  {
                    key: "est_fakir",
                    label: "Fakir",
                    color: "text-red-600",
                    bg: "bg-red-50",
                  },
                  {
                    key: "est_miskin",
                    label: "Miskin",
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                  },
                  {
                    key: "est_gharimin",
                    label: "Gharimin",
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                  },
                  {
                    key: "est_fisabilillah",
                    label: "Fisabilillah",
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    key: "est_ibnu_sabil",
                    label: "Ibnu Sabil",
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                ].map((asnaf) => {
                  const total = result.items.reduce(
                    (sum, item) =>
                      sum +
                      (item[asnaf.key as keyof AllocationResult] as number),
                    0
                  );
                  return (
                    <div
                      key={asnaf.key}
                      className={`${asnaf.bg} rounded-lg p-4`}
                    >
                      <p
                        className={`text-sm font-medium ${asnaf.color}`}
                      >
                        {asnaf.label}
                      </p>
                      <p className={`text-xl font-bold ${asnaf.color} mt-1`}>
                        {formatNumber(total, true)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Approve & Disburse */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Send className="size-5 text-primary" />
                Setujui & Salurkan Dana
              </CardTitle>
              <CardDescription>
                Pastikan saldo mencukupi. Sistem akan memproses penyaluran via gateway yang terhubung.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fund Type Selection */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Sumber Dana</Label>
                <Select
                  value={fundType}
                  onValueChange={(v) => v && setFundType(v as FundType)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZAKAT">Dana Zakat</SelectItem>
                    <SelectItem value="INFAQ">Dana Infaq/Sedekah</SelectItem>
                    <SelectItem value="WAKAF">Dana Wakaf</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Balance Check Button */}
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={async () => {
                  const supabase = createClient();
                  const { data: inst } = await supabase
                    .from("institutions")
                    .select("id")
                    .limit(1)
                    .single();
                  if (inst) {
                    const info = await checkBalance(inst.id, fundType, result.total_allocated);
                    setBalanceInfo(info);
                  }
                }}
              >
                <ShieldCheck className="size-4 mr-2" />
                Cek Saldo {fundType}
              </Button>

              {/* Balance Info */}
              {balanceInfo && (
                <div className={`p-4 rounded-lg border ${balanceInfo.sufficient ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {balanceInfo.sufficient ? (
                      <CheckCircle className="size-4 text-emerald-600" />
                    ) : (
                      <Ban className="size-4 text-red-600" />
                    )}
                    <p className={`font-semibold text-sm ${balanceInfo.sufficient ? "text-emerald-700" : "text-red-700"}`}>
                      {balanceInfo.sufficient ? "Saldo Mencukupi" : "Saldo Tidak Mencukupi"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Saldo {fundType}: {formatRupiah(balanceInfo.current_balance)} — Dibutuhkan: {formatRupiah(result.total_allocated)}
                  </p>
                </div>
              )}

              {/* Disbursement Result */}
              {disbursementResult && (
                <div className={`p-4 rounded-lg border ${disbursementResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  {disbursementResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-5 text-emerald-600" />
                        <p className="font-semibold text-emerald-700">Penyaluran Berhasil Diproses</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Provider: {disbursementResult.provider} | Metode: {disbursementResult.method}
                        {disbursementResult.transaction_id && ` | ID: ${disbursementResult.transaction_id}`}
                      </p>
                      {disbursementResult.method === "CSV_DOWNLOAD" && disbursementResult.csv_data && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            triggerCSVDownload(
                              disbursementResult.csv_data!,
                              `disbursement-${Date.now()}.csv`
                            )
                          }
                        >
                          <Download className="size-4 mr-2" />
                          Download CSV
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-5 text-red-600" />
                      <p className="text-sm text-red-700">{disbursementResult.error}</p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Approve Button */}
              <Button
                size="lg"
                className="w-full h-12 text-base"
                disabled={disbursing || (balanceInfo !== null && !balanceInfo.sufficient) || disbursementResult?.success === true}
                onClick={async () => {
                  setDisbursing(true);
                  setDisbursementResult(null);
                  try {
                    const supabase = createClient();
                    const { data: inst } = await supabase
                      .from("institutions")
                      .select("id")
                      .limit(1)
                      .single();

                    if (!inst) {
                      setDisbursementResult({
                        success: false,
                        provider: "BANK_CSV",
                        method: "API",
                        error: "Lembaga tidak ditemukan.",
                      });
                      return;
                    }

                    const res = await approveAndDisburse({
                      institution_id: inst.id,
                      fund_type: fundType,
                      total_amount: result.total_allocated,
                      reference_id: `ALLOC-${Date.now()}`,
                      description: `Alokasi ${selectedProgramData?.name} ke ${result.total_kecamatan} kecamatan`,
                      items: result.items.map((item) => ({
                        region_name: item.kecamatan_name,
                        amount: item.allocated_amount,
                        description: `${item.program_name} - ${item.kecamatan_name}`,
                      })),
                    });

                    setDisbursementResult(res);

                    if (res.success) {
                      toast.success("Penyaluran berhasil diproses!", {
                        description: `Provider: ${res.provider} | ${formatRupiah(result.total_allocated)}`,
                      });
                    } else {
                      toast.error("Penyaluran gagal", {
                        description: res.error,
                      });
                    }

                    // Auto-download CSV if applicable
                    if (res.success && res.method === "CSV_DOWNLOAD" && res.csv_data) {
                      triggerCSVDownload(res.csv_data, `penyaluran-${Date.now()}.csv`);
                    }
                  } catch (err) {
                    setDisbursementResult({
                      success: false,
                      provider: "BANK_CSV",
                      method: "API",
                      error: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
                    });
                  } finally {
                    setDisbursing(false);
                  }
                }}
              >
                {disbursing ? (
                  <>
                    <Loader2 className="size-5 mr-2 animate-spin" />
                    Memproses Penyaluran...
                  </>
                ) : disbursementResult?.success ? (
                  <>
                    <CheckCircle className="size-5 mr-2" />
                    Penyaluran Selesai
                  </>
                ) : (
                  <>
                    <Send className="size-5 mr-2" />
                    Setujui & Salurkan Dana
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
