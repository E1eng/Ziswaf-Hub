"use client";

import { useState, useTransition } from "react";
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
import { Loader2, UserPlus, Sparkles } from "lucide-react";
import { quickCreateAssessment } from "@/lib/assessments";
import {
  ASNAF_KEYS,
  ASNAF_LABELS,
  HOUSING_OPTIONS,
  type AsnafKey,
} from "@/lib/constants/ziswaf";
import { formatRupiah } from "@/lib/utils/format";
import { toast } from "sonner";

interface Props {
  institutionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AssessmentForm({ institutionId, onSuccess, onCancel }: Props) {
  const [pending, startTransition] = useTransition();

  const [nik, setNik] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [asnaf, setAsnaf] = useState<AsnafKey>("fakir");
  const [income, setIncome] = useState("");
  const [dependents, setDependents] = useState("");
  const [housing, setHousing] = useState("rental");
  const [estimatedAmount, setEstimatedAmount] = useState("");

  const numIncome = Number(income) || 0;
  const numDependents = Number(dependents) || 0;
  const numAmount = Number(estimatedAmount) || 0;
  const canSubmit = nik.length === 16 && fullName.trim().length > 0 && asnaf;

  // Quick estimate berdasarkan asnaf & dependents (mirror logic Telegram webhook)
  const suggestEstimate = () => {
    const baseAmounts: Record<string, number> = {
      fakir: 2_500_000,
      miskin: 2_000_000,
      gharimin: 1_500_000,
      ibnu_sabil: 1_200_000,
      mualaf: 1_000_000,
      fisabilillah: 800_000,
      riqab: 800_000,
      amil: 500_000,
    };
    const base = baseAmounts[asnaf] ?? 1_000_000;
    const total = base + Math.max(0, numDependents - 1) * 300_000;
    setEstimatedAmount(String(total));
    toast.success("Estimasi terisi otomatis", { description: formatRupiah(total) });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      const res = await quickCreateAssessment({
        institutionId,
        nik,
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        asnafCategory: asnaf,
        monthlyIncome: numIncome,
        dependents: numDependents,
        housing: housing as "owned" | "rental" | "family" | "homeless",
        estimatedAmount: numAmount,
      });

      if (!res.success) {
        toast.error("Gagal menyimpan", { description: res.error });
        return;
      }

      const msg = res.isNewMustahik
        ? "Mustahik baru terdaftar + assessment dibuat"
        : "Assessment baru dibuat untuk mustahik existing";
      toast.success(msg, {
        description: `Skor prioritas: ${res.priorityScore}`,
      });
      onSuccess();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="size-5" />
          Tambah Mustahik &amp; Assessment Manual
        </CardTitle>
        <CardDescription>
          Skor prioritas dihitung otomatis dari pendapatan, tanggungan, asnaf, &amp; tempat tinggal.
          Jika NIK sudah terdaftar di registry, akan reuse data identitas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nik">
                NIK (16 digit) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nik"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="3201010101000001"
                maxLength={16}
                required
              />
              {nik.length > 0 && nik.length !== 16 && (
                <p className="text-xs text-destructive">NIK harus 16 digit</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ahmad Fauzi"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">No. HP (opsional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Kategori Asnaf <span className="text-destructive">*</span>
              </Label>
              <Select value={asnaf} onValueChange={(v) => v && setAsnaf(v as AsnafKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASNAF_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>{ASNAF_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="income">Pendapatan Bulanan (Rp)</Label>
              <Input
                id="income"
                type="number"
                min="0"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="500000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deps">Jumlah Tanggungan</Label>
              <Input
                id="deps"
                type="number"
                min="0"
                value={dependents}
                onChange={(e) => setDependents(e.target.value)}
                placeholder="3"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tempat Tinggal</Label>
              <Select value={housing} onValueChange={(v) => v && setHousing(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUSING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Estimasi Dana yang Dibutuhkan (Rp)</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={suggestEstimate}
                className="h-7 text-xs"
              >
                <Sparkles className="size-3 mr-1" />
                Saran Otomatis
              </Button>
            </div>
            <Input
              id="amount"
              type="number"
              min="0"
              value={estimatedAmount}
              onChange={(e) => setEstimatedAmount(e.target.value)}
              placeholder="2500000"
            />
            {numAmount > 0 && (
              <p className="text-xs text-muted-foreground">{formatRupiah(numAmount)}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t">
            <Button type="submit" disabled={!canSubmit || pending}>
              {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Simpan Assessment
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <p className="text-xs text-muted-foreground ml-auto">
              Status: <strong>PENDING</strong> · perlu review supervisor
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
