"use client";

import { useState, useTransition, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ClipboardList, AlertCircle } from "lucide-react";
import { createProgram } from "@/lib/programs";
import {
  FUND_TYPES,
  fundLabel,
  FUND_TYPE_CONFIG,
  ASSISTANCE_TYPES,
  ASSISTANCE_TYPE_LABELS,
  ASNAF_KEYS,
  asnafLabel,
  validAsnafForFund,
  PROGRAM_TYPE,
  type FundType,
  type AsnafKey,
  type AssistanceType,
  type ProgramType,
} from "@/lib/constants/ziswaf";
import { formatRupiah } from "@/lib/utils/format";
import { toast } from "sonner";

interface Props {
  institutionId: string;
}

export function ProgramForm({ institutionId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Default period: bulan ini sampai 3 bulan ke depan
  const today = new Date();
  const defaultStart = today.toISOString().slice(0, 10);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
    .toISOString().slice(0, 10);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fundType, setFundType] = useState<FundType>("zakat");
  const [assistanceType, setAssistanceType] = useState<AssistanceType>("sembako");
  const [programType, setProgramType] = useState<ProgramType>("RUTIN");
  const [targetAsnaf, setTargetAsnaf] = useState<AsnafKey[]>(["fakir", "miskin"]);
  const [budget, setBudget] = useState("");
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [beneficiaryTarget, setBeneficiaryTarget] = useState("");

  // Allowed asnaf based on fundType
  const allowedAsnaf = useMemo(() => validAsnafForFund(fundType), [fundType]);
  const isWakaf = fundType === "wakaf";

  // When fundType changes, prune targetAsnaf to only valid options
  const handleFundTypeChange = (v: FundType) => {
    setFundType(v);
    if (v === "wakaf") {
      setTargetAsnaf([]);
      return;
    }
    const allowed = validAsnafForFund(v);
    setTargetAsnaf((prev) => prev.filter((a) => allowed.includes(a)));
  };

  const toggleAsnaf = (a: AsnafKey) => {
    setTargetAsnaf((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const numBudget = Number(budget) || 0;
  const canSubmit =
    name.trim().length > 0 &&
    !isWakaf &&
    targetAsnaf.length > 0 &&
    numBudget > 0 &&
    periodStart &&
    periodEnd &&
    new Date(periodEnd) >= new Date(periodStart);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;

    startTransition(async () => {
      const res = await createProgram({
        institutionId,
        name,
        description: description || undefined,
        fundType,
        assistanceType,
        targetAsnaf,
        budget: numBudget,
        periodStart,
        periodEnd,
        beneficiaryTarget: Number(beneficiaryTarget) || undefined,
        programType,
      });

      if (!res.success) {
        toast.error("Gagal membuat program", { description: res.error });
        return;
      }

      toast.success("Program berhasil dibuat (status: DRAFT)");
      router.push(`/dashboard/program/${res.programId}`);
    });
  }

  const fundConfig = FUND_TYPE_CONFIG[fundType];

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="size-5" />
              Informasi Program
            </CardTitle>
            <CardDescription>Detail dasar program penyaluran</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Nama Program <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bantuan Sembako Ramadan 2026"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Deskripsi</Label>
              <textarea
                id="desc"
                className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail program, tujuan, dan KPI..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5 md:col-span-1">
                <Label>
                  Tipe Program <span className="text-destructive">*</span>
                </Label>
                <Select value={programType} onValueChange={(v) => v && setProgramType(v as ProgramType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROGRAM_TYPE) as ProgramType[]).map((t) => (
                      <SelectItem key={t} value={t}>{PROGRAM_TYPE[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>
                  Jenis Bantuan <span className="text-destructive">*</span>
                </Label>
                <Select value={assistanceType} onValueChange={(v) => v && setAssistanceType(v as AssistanceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSISTANCE_TYPES.map((a) => (
                      <SelectItem key={a} value={a}>{ASSISTANCE_TYPE_LABELS[a]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fund type & fiqih */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jenis Dana &amp; Target Asnaf</CardTitle>
            <CardDescription>
              Sistem akan enforce kesesuaian fiqih: zakat &amp; DSKL hanya boleh ke 8 asnaf, infaq/sedekah bebas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Jenis Dana <span className="text-destructive">*</span>
              </Label>
              <Select value={fundType} onValueChange={(v) => v && handleFundTypeChange(v as FundType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUND_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>{fundLabel(f)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {fundConfig.description}
              </p>
            </div>

            {isWakaf ? (
              <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">Wakaf belum didukung wizard alokasi</p>
                  <p className="text-amber-800 mt-1">
                    Wakaf bersifat permanen (asset-based), berbeda dengan zakat/infaq yang dikonsumsi.
                    Modul wakaf akan diimplementasikan di roadmap pasca-hackathon.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>
                  Target Asnaf <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Pilih satu atau lebih kategori asnaf yang akan menjadi penerima manfaat program ini.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASNAF_KEYS.map((a) => {
                    const allowed = allowedAsnaf.includes(a);
                    const selected = targetAsnaf.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        disabled={!allowed}
                        onClick={() => toggleAsnaf(a)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : allowed
                              ? "hover:bg-muted"
                              : "opacity-40 cursor-not-allowed"
                        }`}
                      >
                        {asnafLabel(a)}
                      </button>
                    );
                  })}
                </div>
                {targetAsnaf.length === 0 && (
                  <p className="text-xs text-destructive mt-1">Pilih minimal satu asnaf</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget & period */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anggaran &amp; Periode</CardTitle>
            <CardDescription>Periode penting untuk dedup check antar program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="budget">
                  Anggaran (Rp) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="budget"
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="500000000"
                  required
                />
                {numBudget > 0 && (
                  <p className="text-xs text-muted-foreground">{formatRupiah(numBudget)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target">Target Penerima (opsional)</Label>
                <Input
                  id="target"
                  type="number"
                  min="0"
                  value={beneficiaryTarget}
                  onChange={(e) => setBeneficiaryTarget(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ps">
                  Mulai Periode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ps"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pe">
                  Akhir Periode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pe"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canSubmit || pending}>
            {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Buat Program (Draft)
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/program")}>
            Batal
          </Button>
        </div>
      </div>
    </form>
  );
}
