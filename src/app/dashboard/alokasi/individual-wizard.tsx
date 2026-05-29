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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  Users,
  ChevronRight,
  Loader2,
  CheckCircle,
  Target,
  Send,
  Banknote,
  AlertTriangle,
  Download,
} from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SelectedProposal {
  id: string;
  nik_masked: string;
  full_name: string;
  asnaf_category: string;
  priority_score: number;
  allocated_amount: number;
}

interface KnapsackResult {
  total_budget: number;
  total_allocated: number;
  total_beneficiaries: number;
  remaining_budget: number;
  selected: SelectedProposal[];
}

const ASNAF_LABELS: Record<string, string> = {
  fakir: "Fakir",
  miskin: "Miskin",
  amil: "Amil",
  mualaf: "Mualaf",
  riqab: "Riqab",
  gharimin: "Gharimin",
  fisabilillah: "Fisabilillah",
  ibnu_sabil: "Ibnu Sabil",
};

function maskNik(nik: string): string {
  if (nik.length < 8) return "****";
  return nik.slice(0, 4) + "****" + nik.slice(-4);
}

export function IndividualAllocationWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [disbursing, setDisbursing] = useState(false);
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<KnapsackResult | null>(null);
  const [disbursementDone, setDisbursementDone] = useState(false);
  const [batchCode, setBatchCode] = useState<string | null>(null);

  const canCalculate = budget && parseInt(budget) > 0;

  // Step 2: Knapsack selection
  const handleCalculate = useCallback(async () => {
    if (!canCalculate) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const budgetNum = parseInt(budget);

      // Fetch all APPROVED proposals sorted by priority_score DESC
      const { data: proposals, error } = await supabase
        .from("mustahik_proposals")
        .select("id, nik, full_name, asnaf_category, priority_score, allocated_amount")
        .eq("status", "APPROVED")
        .order("priority_score", { ascending: false })
        .limit(500);

      if (error || !proposals) {
        toast.error("Gagal mengambil data proposal", { description: error?.message });
        setLoading(false);
        return;
      }

      if (proposals.length === 0) {
        toast.error("Tidak ada proposal berstatus APPROVED", {
          description: "Setujui proposal terlebih dahulu di halaman E-Proposal",
        });
        setLoading(false);
        return;
      }

      // Greedy knapsack: pick highest priority individuals until budget exhausted
      const selected: SelectedProposal[] = [];
      let totalAllocated = 0;

      for (const p of proposals) {
        const amount = p.allocated_amount || 0;
        if (totalAllocated + amount <= budgetNum) {
          selected.push({
            id: p.id,
            nik_masked: maskNik(p.nik),
            full_name: p.full_name,
            asnaf_category: p.asnaf_category,
            priority_score: p.priority_score,
            allocated_amount: amount,
          });
          totalAllocated += amount;
        }
      }

      if (selected.length === 0) {
        toast.error("Anggaran terlalu kecil", {
          description: "Tidak ada individu yang bisa dialokasikan dengan anggaran ini",
        });
        setLoading(false);
        return;
      }

      setResult({
        total_budget: budgetNum,
        total_allocated: totalAllocated,
        total_beneficiaries: selected.length,
        remaining_budget: budgetNum - totalAllocated,
        selected,
      });
      setStep(2);
    } catch (err) {
      console.error("Knapsack error:", err);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [budget, canCalculate]);

  // Step 3: Disburse — mark proposals + create batch
  const handleDisburse = useCallback(async () => {
    if (!result) return;

    setDisbursing(true);
    try {
      const supabase = createClient();
      const proposalIds = result.selected.map((s) => s.id);
      const code = "ZH-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 999999)).padStart(6, "0");

      // Create disbursement batch (starts as PROCESSING, admin progresses status)
      const { data: batchData, error: batchErr } = await supabase
        .from("disbursement_batches")
        .insert({
          batch_code: code,
          total_amount: result.total_allocated,
          beneficiary_count: result.total_beneficiaries,
          fund_type: "ZISWAF",
          status: "PROCESSING",
          kecamatan_summary: [],
        })
        .select("id")
        .single();

      if (batchErr) {
        toast.error("Gagal membuat batch", { description: batchErr.message });
        setDisbursing(false);
        return;
      }

      // Mark proposals as DISBURSED
      const { error: updateErr } = await supabase
        .from("mustahik_proposals")
        .update({
          status: "DISBURSED",
          disbursement_batch_id: batchData.id,
          disbursed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("id", proposalIds);

      if (updateErr) {
        toast.error("Gagal update proposal", { description: updateErr.message });
        setDisbursing(false);
        return;
      }

      toast.success("Penyaluran berhasil!", {
        description: `Batch: ${code} — ${result.total_beneficiaries} penerima`,
      });
      setBatchCode(code);
      setDisbursementDone(true);
      setStep(3);
    } catch (err) {
      console.error("Disburse error:", err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setDisbursing(false);
    }
  }, [result]);

  const exportCSV = useCallback(() => {
    if (!result || !batchCode) return;
    const header = "No,Nama,Asnaf,Skor Prioritas,Dana Dialokasikan (Rp)";
    const rows = result.selected.map((s, i) =>
      `${i + 1},"${s.full_name}","${s.asnaf_category}",${s.priority_score},${s.allocated_amount}`
    );
    const footer = `\n"","TOTAL","","",${result.total_allocated}`;
    const csv = [header, ...rows].join("\n") + footer;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `penyaluran-${batchCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, batchCode]);

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        {[
          { num: 1, label: "Masukkan Anggaran" },
          { num: 2, label: "Seleksi Otomatis (Knapsack)" },
          { num: 3, label: "Salurkan Dana" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="size-4 text-muted-foreground" />}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                step >= s.num
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="font-semibold">{s.num}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Budget Input */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Banknote className="size-6 text-primary" />
              Target Anggaran Penyaluran
            </CardTitle>
            <CardDescription>
              Masukkan total anggaran. Sistem akan otomatis memilih individu dengan skor prioritas tertinggi (greedy knapsack).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-base">Anggaran (Rupiah)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Contoh: 500000000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="text-lg h-12"
              />
              {budget && parseInt(budget) > 0 && (
                <p className="text-sm text-muted-foreground">
                  = {formatRupiah(parseInt(budget))}
                </p>
              )}
            </div>

            <Button
              size="lg"
              className="gap-2 mt-4"
              disabled={!canCalculate || loading}
              onClick={handleCalculate}
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Menghitung...
                </>
              ) : (
                <>
                  <Calculator className="size-5" />
                  Hitung Alokasi Optimal
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Result & Confirm */}
      {step === 2 && result && (
        <>
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-primary/50">
              <CardContent className="pt-5 text-center">
                <p className="text-sm text-muted-foreground">Total Anggaran</p>
                <p className="text-xl font-bold text-primary">{formatRupiah(result.total_budget)}</p>
              </CardContent>
            </Card>
            <Card className="border-green-300">
              <CardContent className="pt-5 text-center">
                <p className="text-sm text-muted-foreground">Teralokasi</p>
                <p className="text-xl font-bold text-green-600">{formatRupiah(result.total_allocated)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-sm text-muted-foreground">Penerima</p>
                <p className="text-xl font-bold">{result.total_beneficiaries} orang</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="text-sm text-muted-foreground">Sisa Anggaran</p>
                <p className="text-xl font-bold text-muted-foreground">{formatRupiah(result.remaining_budget)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Efficiency */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 text-sm">
                <Target className="size-5 text-primary" />
                <span>Efisiensi alokasi: <strong>{((result.total_allocated / result.total_budget) * 100).toFixed(1)}%</strong> dari anggaran</span>
                <span className="text-muted-foreground">•</span>
                <span>Rata-rata per penerima: <strong>{formatRupiah(Math.round(result.total_allocated / result.total_beneficiaries))}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Individu Terpilih (by Priority Score)</CardTitle>
              <CardDescription>
                {result.total_beneficiaries} individu dipilih secara otomatis berdasarkan skor prioritas tertinggi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Asnaf</TableHead>
                      <TableHead className="text-center">Skor</TableHead>
                      <TableHead className="text-right">Alokasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.selected.map((s, idx) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{s.nik_masked}</TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ASNAF_LABELS[s.asnaf_category] || s.asnaf_category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${s.priority_score >= 60 ? "text-red-600" : s.priority_score >= 40 ? "text-amber-600" : "text-green-600"}`}>
                            {s.priority_score}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(s.allocated_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => { setStep(1); setResult(null); }}>
              ← Ubah Anggaran
            </Button>
            <Button
              size="lg"
              className="gap-2"
              disabled={disbursing || disbursementDone}
              onClick={handleDisburse}
            >
              {disbursing ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Memproses Penyaluran...
                </>
              ) : (
                <>
                  <Send className="size-5" />
                  Setujui & Salurkan Dana
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Done */}
      {step === 3 && disbursementDone && (
        <Card className="border-green-300">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle className="size-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-green-700">Penyaluran Berhasil!</h2>
            <p className="text-muted-foreground text-lg">
              Dana telah dialokasikan ke {result?.total_beneficiaries} penerima manfaat
            </p>
            {batchCode && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Kode Batch:</span>
                <code className="font-bold text-lg">{batchCode}</code>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Kode batch ini dapat digunakan untuk melacak status penyaluran di halaman publik
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" onClick={exportCSV} className="gap-2">
                <Download className="size-4" />
                Download CSV
              </Button>
              <Button variant="outline" onClick={() => { setStep(1); setResult(null); setDisbursementDone(false); setBatchCode(null); }}>
                Buat Alokasi Baru
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
