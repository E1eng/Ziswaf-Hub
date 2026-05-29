"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";

interface GapRow {
  region_id: string;
  region_name: string;
  gap_percentage: number;
  poverty_rate: number;
  ipm: number;
  estimated_potential: number;
  actual_collection: number;
}

interface Props {
  gapData: GapRow[];
  provinceNames: string[];
}

export function AnalitikFilters({ gapData, provinceNames }: Props) {
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");

  const filtered = selectedProvince === "ALL"
    ? gapData.slice(0, 10)
    : gapData.filter((g) => g.region_name === selectedProvince);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Daerah yang Paling Butuh Perhatian</CardTitle>
            <CardDescription className="text-sm">
              Provinsi dimana potensi ZISWAF masih jauh dari yang terkumpul
            </CardDescription>
          </div>
          <Select value={selectedProvince} onValueChange={(v) => v && setSelectedProvince(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter provinsi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Provinsi</SelectItem>
              {provinceNames.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Tidak ada data untuk provinsi ini</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-5">
            {filtered.map((g) => (
              <div key={g.region_id} className="p-4 border rounded-xl text-center space-y-1">
                <p className="text-base font-semibold">{g.region_name}</p>
                <p className="text-3xl font-bold text-red-600">{formatPct(g.gap_percentage || 0)}</p>
                <p className="text-sm text-muted-foreground">belum tercapai</p>
                <Separator className="my-2" />
                <p className="text-sm">Potensi: {formatRupiah(g.estimated_potential || 0)}</p>
                <p className="text-sm">Aktual: {formatRupiah(g.actual_collection || 0)}</p>
                <Separator className="my-2" />
                <p className="text-sm">Kemiskinan: {formatPct(g.poverty_rate || 0)}</p>
                <p className="text-sm">IPM: {(g.ipm || 0).toFixed(1)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
