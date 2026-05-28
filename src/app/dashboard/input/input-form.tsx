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
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Props {
  regions: { id: string; name: string }[];
  categories: { id: string; name: string; category: string }[];
  sectors: { id: string; name: string; code: string }[];
  institutionId: string;
}

export function InputDataForm({ regions, categories, sectors, institutionId }: Props) {
  const [dataType, setDataType] = useState<"pengumpulan" | "penyaluran">("pengumpulan");
  const [regionId, setRegionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("2024");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    if (dataType === "pengumpulan") {
      const { error } = await supabase.from("collections").insert({
        institution_id: institutionId,
        region_id: regionId,
        ziswaf_category_id: categoryId,
        year: Number(year),
        month: month ? Number(month) : null,
        amount: Number(amount),
        donor_count: count ? Number(count) : 0,
      });
      if (error) {
        toast.error("Gagal menyimpan", { description: error.message });
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("distributions").insert({
        institution_id: institutionId,
        region_id: regionId,
        sector_id: sectorId,
        year: Number(year),
        month: month ? Number(month) : null,
        amount: Number(amount),
        beneficiary_count: count ? Number(count) : 0,
      });
      if (error) {
        toast.error("Gagal menyimpan", { description: error.message });
        setLoading(false);
        return;
      }
    }

    toast.success("Data berhasil disimpan");
    setSuccess(true);
    setLoading(false);
  }

  function reset() {
    setSuccess(false);
    setAmount("");
    setCount("");
    setMonth("");
    setRegionId("");
    setCategoryId("");
    setSectorId("");
  }

  if (success) {
    return (
      <Card className="max-w-lg">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle className="size-14 mx-auto text-green-600" />
          <h3 className="text-xl font-bold">Data Berhasil Disimpan</h3>
          <p className="text-base text-muted-foreground">
            Data {dataType} Anda sudah tercatat. Terima kasih!
          </p>
          <Button onClick={reset} variant="outline">Tambah Data Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-xl">Tambah Data {dataType === "pengumpulan" ? "Pengumpulan" : "Penyaluran"}</CardTitle>
        <CardDescription className="text-sm">
          Pilih jenis data lalu isi kolom di bawah ini
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Data Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={dataType === "pengumpulan" ? "default" : "outline"}
              size="sm"
              onClick={() => setDataType("pengumpulan")}
            >
              Pengumpulan
            </Button>
            <Button
              type="button"
              variant={dataType === "penyaluran" ? "default" : "outline"}
              size="sm"
              onClick={() => setDataType("penyaluran")}
            >
              Penyaluran
            </Button>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label>Provinsi</Label>
            <Select value={regionId} onValueChange={(val) => { if (val) setRegionId(val); }}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih provinsi" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category/Sector */}
          {dataType === "pengumpulan" ? (
            <div className="space-y-2">
              <Label>Kategori ZISWAF</Label>
              <Select value={categoryId} onValueChange={(val) => { if (val) setCategoryId(val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      <Badge variant="outline" className="ml-2 text-xs">{c.category}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Sektor Penyaluran</Label>
              <Select value={sectorId} onValueChange={(val) => { if (val) setSectorId(val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sektor" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>Jumlah (Rp)</Label>
            <Input
              type="number"
              placeholder="Contoh: 500000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Count */}
          <div className="space-y-2">
            <Label>{dataType === "pengumpulan" ? "Jumlah Donatur" : "Jumlah Penerima Manfaat"}</Label>
            <Input
              type="number"
              placeholder="Contoh: 1000"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select value={month} onValueChange={(val) => { if (val) setMonth(val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2024, i).toLocaleString("id-ID", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={2019}
                max={2025}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !regionId || !amount}>
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            {loading ? "Menyimpan..." : "Simpan Data"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
