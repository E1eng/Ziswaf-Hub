"use client";

import { useState, useMemo, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calculator,
  Send,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Filter,
  XCircle,
} from "lucide-react";
import { confirmAllocation, type AllocationCandidate } from "@/lib/allocation";
import { formatRupiah } from "@/lib/utils/format";
import { maskNik } from "@/lib/utils/privacy";
import {
  asnafLabel,
  fundLabel,
  ASSISTANCE_TYPE_LABELS,
  type AssistanceType,
} from "@/lib/constants/ziswaf";
import { toast } from "sonner";

interface Props {
  programId: string;
  programName: string;
  fundType: string;
  assistanceType: string;
  remainingBudget: number;
  poolBalance: number;
  initialCandidates: AllocationCandidate[];
}

interface SelectionState {
  [assessmentId: string]: {
    selected: boolean;
    customAmount?: number;
    duplicateOverride?: boolean;
    duplicateReason?: string;
  };
}

export function AllocationWizard({
  programId,
  programName,
  fundType,
  assistanceType,
  remainingBudget,
  poolBalance,
  initialCandidates,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Effective budget = min(remaining program budget, pool balance)
  const effectiveBudget = Math.min(remainingBudget, poolBalance);
  const [budgetInput, setBudgetInput] = useState(String(Math.max(0, Math.floor(effectiveBudget))));
  const [showOverrideUI, setShowOverrideUI] = useState(false);
  const [hideDups, setHideDups] = useState(true);
  const [selections, setSelections] = useState<SelectionState>({});

  const budgetNum = Number(budgetInput) || 0;

  // Auto-suggest by greedy knapsack
  const autoSuggest = () => {
    if (budgetNum <= 0) {
      toast.error("Masukkan anggaran yang valid");
      return;
    }

    const newSelections: SelectionState = {};
    let total = 0;

    for (const c of initialCandidates) {
      if (c.duplicates.length > 0 && hideDups) continue;
      if (c.estimatedAmount <= 0) continue;
      if (total + c.estimatedAmount <= budgetNum) {
        newSelections[c.assessmentId] = {
          selected: true,
          customAmount: c.estimatedAmount,
        };
        total += c.estimatedAmount;
      }
    }

    setSelections(newSelections);
    const count = Object.keys(newSelections).length;
    if (count === 0) {
      toast.error("Tidak ada kandidat yang muat di anggaran. Naikkan anggaran atau periksa kandidat.");
    } else {
      toast.success(`${count} mustahik dipilih otomatis`, {
        description: `Total ${formatRupiah(total)} dari anggaran ${formatRupiah(budgetNum)}`,
      });
    }
  };

  const toggleSelection = (c: AllocationCandidate) => {
    setSelections((prev) => {
      const cur = prev[c.assessmentId];
      if (cur?.selected) {
        const next = { ...prev };
        delete next[c.assessmentId];
        return next;
      }
      return {
        ...prev,
        [c.assessmentId]: {
          selected: true,
          customAmount: c.estimatedAmount,
          duplicateOverride: c.duplicates.length > 0 ? cur?.duplicateOverride ?? false : false,
          duplicateReason: cur?.duplicateReason,
        },
      };
    });
  };

  const updateAmount = (assessmentId: string, amount: number) => {
    setSelections((prev) => {
      const cur = prev[assessmentId];
      if (!cur?.selected) return prev;
      return { ...prev, [assessmentId]: { ...cur, customAmount: amount } };
    });
  };

  const setOverride = (assessmentId: string, override: boolean, reason?: string) => {
    setSelections((prev) => {
      const cur = prev[assessmentId];
      if (!cur?.selected) return prev;
      return { ...prev, [assessmentId]: { ...cur, duplicateOverride: override, duplicateReason: reason } };
    });
  };

  const resetSelections = () => setSelections({});

  // Computed
  const visibleCandidates = useMemo(() => {
    return initialCandidates.filter((c) => !hideDups || c.duplicates.length === 0);
  }, [initialCandidates, hideDups]);

  const selectedItems = useMemo(() => {
    const items = initialCandidates
      .filter((c) => selections[c.assessmentId]?.selected)
      .map((c) => ({
        candidate: c,
        amount: selections[c.assessmentId].customAmount ?? c.estimatedAmount,
        override: selections[c.assessmentId].duplicateOverride ?? false,
        reason: selections[c.assessmentId].duplicateReason,
      }));
    return items;
  }, [initialCandidates, selections]);

  const totalSelected = selectedItems.reduce((s, x) => s + x.amount, 0);
  const overBudget = totalSelected > budgetNum;
  const overPool = totalSelected > poolBalance;
  const dupSelectedWithoutOverride = selectedItems.filter(
    (x) => x.candidate.duplicates.length > 0 && !x.override
  );

  // Validation: kalau ada duplikat selected tanpa override → tidak bisa confirm
  const canConfirm =
    selectedItems.length > 0 &&
    !overBudget &&
    !overPool &&
    dupSelectedWithoutOverride.length === 0 &&
    selectedItems.every((x) => x.amount > 0);

  // Confirm
  const handleConfirm = () => {
    if (!canConfirm) return;
    if (!confirm(
      `Konfirmasi alokasi:\n` +
      `${selectedItems.length} penerima\n` +
      `Total ${formatRupiah(totalSelected)}\n\n` +
      `Batch akan dibuat dengan status PROCESSING. Lanjutkan?`
    )) return;

    startTransition(async () => {
      const res = await confirmAllocation({
        programId,
        selections: selectedItems.map((x) => ({
          assessmentId: x.candidate.assessmentId,
          amount: x.amount,
          duplicateOverride: x.override,
          duplicateReason: x.reason,
        })),
      });

      if (!res.success) {
        toast.error("Gagal konfirmasi alokasi", { description: res.error });
        return;
      }

      toast.success(`Batch ${res.batchCode} berhasil dibuat`, {
        description: `${res.beneficiaryCount} penerima · ${formatRupiah(res.totalAmount ?? 0)}`,
      });
      // Reset & refresh
      setSelections({});
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="size-5" />
          Alokasi Cerdas — Greedy Knapsack
        </CardTitle>
        <CardDescription>
          {programName} · {fundLabel(fundType)} · {ASSISTANCE_TYPE_LABELS[assistanceType as AssistanceType] ?? assistanceType}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Step 1: Budget */}
        <div className="border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span className="font-semibold">Tentukan Anggaran Alokasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Saran:</span>
              <Badge variant="secondary" className="text-xs">
                Pool {formatRupiah(poolBalance)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Sisa {formatRupiah(remainingBudget)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              type="number"
              min="0"
              max={effectiveBudget}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Masukkan anggaran..."
              className="text-base"
            />
            <Button onClick={autoSuggest} disabled={budgetNum <= 0}>
              <Sparkles className="size-4 mr-2" />
              Saran Otomatis
            </Button>
            <Button variant="outline" onClick={resetSelections} disabled={selectedItems.length === 0}>
              <RotateCcw className="size-4 mr-2" />
              Reset
            </Button>
          </div>

          {budgetNum > effectiveBudget && (
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" />
              Anggaran melebihi minimum dari sisa budget program ({formatRupiah(remainingBudget)})
              dan saldo pool ({formatRupiah(poolBalance)}).
            </p>
          )}
        </div>

        {/* Step 2: Candidates */}
        <div className="border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span className="font-semibold">Pilih Penerima Manfaat</span>
              <Badge variant="outline" className="text-xs">
                {visibleCandidates.length} kandidat
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideDups}
                  onChange={(e) => setHideDups(e.target.checked)}
                  className="size-4"
                />
                <Filter className="size-3.5" />
                Sembunyikan duplikat
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOverrideUI}
                  onChange={(e) => setShowOverrideUI(e.target.checked)}
                  className="size-4"
                />
                Tampilkan UI override
              </label>
            </div>
          </div>

          {initialCandidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada mustahik dengan assessment APPROVED yang asnaf-nya match target program ini.
              <br />
              Buka <a href="/dashboard/proposal" className="text-primary hover:underline">Registry &amp; Assessment</a> untuk approve assessment.
            </div>
          ) : (
            <div className="border rounded-md overflow-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 w-8"></th>
                    <th className="text-left p-2">NIK</th>
                    <th className="text-left p-2">Nama</th>
                    <th className="text-left p-2">Asnaf</th>
                    <th className="text-center p-2">Skor</th>
                    <th className="text-right p-2">Estimasi</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCandidates.map((c) => {
                    const sel = selections[c.assessmentId];
                    const isSelected = sel?.selected ?? false;
                    const hasDup = c.duplicates.length > 0;
                    return (
                      <Fragment key={c.assessmentId}>
                        <tr
                          className={`border-t ${isSelected ? "bg-emerald-50" : ""} ${
                            hasDup ? "bg-amber-50/40" : ""
                          }`}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(c)}
                              className="size-4"
                            />
                          </td>
                          <td className="p-2 font-mono text-xs">{maskNik(c.nik)}</td>
                          <td className="p-2 font-medium">{c.fullName}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">{asnafLabel(c.asnafCategory)}</Badge>
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`font-bold ${
                                c.priorityScore >= 60
                                  ? "text-red-600"
                                  : c.priorityScore >= 40
                                  ? "text-amber-600"
                                  : "text-green-600"
                              }`}
                            >
                              {c.priorityScore}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            {isSelected ? (
                              <Input
                                type="number"
                                min="0"
                                value={sel?.customAmount ?? c.estimatedAmount}
                                onChange={(e) => updateAmount(c.assessmentId, Number(e.target.value))}
                                className="h-7 text-xs w-32 ml-auto"
                              />
                            ) : (
                              <span className="text-muted-foreground">{formatRupiah(c.estimatedAmount)}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {hasDup ? (
                              <Badge variant="outline" className="text-xs gap-1 bg-amber-50 border-amber-300 text-amber-800">
                                <AlertTriangle className="size-3" />
                                {c.duplicates.length} duplikat
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs gap-1 bg-emerald-50 border-emerald-300 text-emerald-700">
                                <CheckCircle2 className="size-3" />
                                Bersih
                              </Badge>
                            )}
                          </td>
                        </tr>
                        {/* Duplicate detail row */}
                        {hasDup && isSelected && (
                          <tr className="border-t bg-amber-50/40">
                            <td colSpan={7} className="p-3">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-amber-900">
                                  ⚠ Mustahik ini sudah pernah menerima bantuan sejenis dalam periode tumpang-tindih:
                                </p>
                                <div className="space-y-1">
                                  {c.duplicates.map((d, i) => (
                                    <div key={i} className="text-xs text-amber-800 pl-3 border-l-2 border-amber-300">
                                      Dari <strong>{d.sourceInstitutionName}</strong> · batch{" "}
                                      <code className="bg-amber-100 px-1 rounded">{d.sourceBatchCode}</code> ·{" "}
                                      {ASSISTANCE_TYPE_LABELS[d.sourceAssistanceType as AssistanceType] ?? d.sourceAssistanceType} ·{" "}
                                      {formatRupiah(d.sourceAmount)} · periode{" "}
                                      {new Date(d.sourcePeriodStart).toLocaleDateString("id-ID")} –{" "}
                                      {new Date(d.sourcePeriodEnd).toLocaleDateString("id-ID")}
                                    </div>
                                  ))}
                                </div>

                                <div className="pt-2 space-y-2">
                                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={sel?.duplicateOverride ?? false}
                                      onChange={(e) => setOverride(c.assessmentId, e.target.checked, sel?.duplicateReason)}
                                      className="size-4"
                                    />
                                    <strong>Override</strong> — saya tetap ingin alokasikan ke mustahik ini
                                  </label>
                                  {sel?.duplicateOverride && (
                                    <Input
                                      placeholder="Alasan override (wajib, akan tercatat di audit log)..."
                                      value={sel?.duplicateReason ?? ""}
                                      onChange={(e) => setOverride(c.assessmentId, true, e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Step 3: Confirm */}
        {selectedItems.length > 0 && (
          <div className="border-2 border-primary/40 rounded-xl p-4 space-y-3 bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span className="font-semibold">Konfirmasi &amp; Buat Batch</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Penerima" value={`${selectedItems.length} orang`} />
              <Stat label="Total Alokasi" value={formatRupiah(totalSelected)} accent={overBudget ? "text-red-600" : "text-emerald-600"} />
              <Stat label="vs Anggaran" value={formatRupiah(budgetNum)} />
              <Stat
                label="Efisiensi"
                value={budgetNum > 0 ? `${((totalSelected / budgetNum) * 100).toFixed(1)}%` : "-"}
              />
            </div>

            {/* Validation warnings */}
            <div className="space-y-1.5">
              {overBudget && (
                <div className="text-xs text-red-700 flex items-center gap-1.5">
                  <XCircle className="size-3.5" />
                  Total alokasi <strong>{formatRupiah(totalSelected)}</strong> melebihi anggaran{" "}
                  <strong>{formatRupiah(budgetNum)}</strong>
                </div>
              )}
              {overPool && (
                <div className="text-xs text-red-700 flex items-center gap-1.5">
                  <XCircle className="size-3.5" />
                  Total alokasi melebihi saldo pool <strong>{formatRupiah(poolBalance)}</strong>
                </div>
              )}
              {dupSelectedWithoutOverride.length > 0 && (
                <div className="text-xs text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  {dupSelectedWithoutOverride.length} penerima berstatus duplikat tanpa override.
                  Centang &quot;Override&quot; pada mereka atau hapus dari pilihan.
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleConfirm}
              disabled={!canConfirm || pending}
            >
              {pending ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Send className="size-4 mr-2" />
              )}
              Konfirmasi &amp; Buat Batch ({selectedItems.length} penerima · {formatRupiah(totalSelected)})
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Batch akan dibuat dengan status PROCESSING. Update status ke DISBURSED nanti di halaman Penyaluran.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-background rounded-lg p-3 border">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-bold mt-0.5 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}
