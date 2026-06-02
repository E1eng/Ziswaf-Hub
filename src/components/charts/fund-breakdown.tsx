"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatRupiah } from "@/lib/utils/format";
import { fundLabel } from "@/lib/constants/ziswaf";

interface Slice {
  fundType: string;
  donated: number;
}

const COLORS: Record<string, string> = {
  zakat: "hsl(160 84% 39%)",
  infaq: "hsl(217 91% 60%)",
  sedekah: "hsl(348 83% 47%)",
  wakaf: "hsl(263 70% 50%)",
  dskl: "hsl(38 92% 50%)",
};

export function FundBreakdownChart({ data }: { data: Slice[] }) {
  const filtered = data.filter((d) => d.donated > 0);

  if (filtered.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
        Belum ada donasi
      </div>
    );
  }

  const chartData = filtered.map((d) => ({
    name: fundLabel(d.fundType),
    value: d.donated,
    key: d.fundType,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key] ?? "hsl(0 0% 60%)"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [formatRupiah(Number(v ?? 0)), "Total"]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
