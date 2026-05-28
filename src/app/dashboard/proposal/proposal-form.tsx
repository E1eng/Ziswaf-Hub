"use client";

import { useState } from "react";
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
import { Loader2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const ASNAF_OPTIONS = [
  { value: "fakir", label: "Fakir" },
  { value: "miskin", label: "Miskin" },
  { value: "amil", label: "Amil" },
  { value: "mualaf", label: "Mualaf" },
  { value: "riqab", label: "Riqab" },
  { value: "gharimin", label: "Gharimin" },
  { value: "fisabilillah", label: "Fisabilillah" },
  { value: "ibnu_sabil", label: "Ibnu Sabil" },
];

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProposalForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);

  const [nik, setNik] = useState("");
  const [fullName, setFullName] = useState("");
  const [asnaf, setAsnaf] = useState("");
  const [income, setIncome] = useState("");
  const [dependents, setDependents] = useState("");
  const [housing, setHousing] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState("");

  const canSubmit = nik.length === 16 && fullName.trim() && asnaf && income && allocatedAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    const supabase = createClient();

    const metrics = {
      monthly_income: Number(income),
      dependents: Number(dependents) || 0,
      housing: housing || "unknown",
    };

    const { error } = await supabase.from("mustahik_proposals").insert({
      nik,
      full_name: fullName.trim(),
      asnaf_category: asnaf,
      metrics,
      allocated_amount: Number(allocatedAmount),
      source: "MANUAL",
      status: "PENDING",
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("NIK sudah terdaftar", { description: "Mustahik ini sudah memiliki proposal aktif." });
      } else {
        toast.error("Gagal menyimpan", { description: error.message });
      }
    } else {
      toast.success("Proposal berhasil diajukan", { description: `${fullName} ditambahkan ke antrian review.` });
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserPlus className="size-5" />
          Ajukan Proposal Mustahik Baru
        </CardTitle>
        <CardDescription>
          Masukkan data calon penerima. Skor prioritas dihitung otomatis oleh sistem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nik">NIK (16 digit)</Label>
              <Input
                id="nik"
                placeholder="3201010101000001"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                maxLength={16}
              />
              {nik && nik.length !== 16 && (
                <p className="text-xs text-red-500">NIK harus 16 digit</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Ahmad Fauzi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kategori Asnaf</Label>
              <Select value={asnaf} onValueChange={setAsnaf}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {ASNAF_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Estimasi Dana Dibutuhkan (Rp)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="2500000"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="income">Pendapatan/Bulan (Rp)</Label>
              <Input
                id="income"
                type="number"
                placeholder="500000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependents">Jumlah Tanggungan</Label>
              <Input
                id="dependents"
                type="number"
                placeholder="3"
                value={dependents}
                onChange={(e) => setDependents(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status Tempat Tinggal</Label>
              <Select value={housing} onValueChange={setHousing}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own">Milik Sendiri</SelectItem>
                  <SelectItem value="rental">Sewa/Kontrak</SelectItem>
                  <SelectItem value="family">Numpang Keluarga</SelectItem>
                  <SelectItem value="homeless">Tidak Punya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              Ajukan Proposal
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
