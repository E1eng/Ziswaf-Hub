"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ZiswafData {
  name: string;
  amount: number;
}

const ZISWAF_COLORS: Record<string, string> = {
  zakat: "#2563eb",
  infaq: "#16a34a",
  sedekah: "#f59e0b",
  wakaf: "#8b5cf6",
  dskl: "#6b7280",
};

const ZISWAF_LABELS: Record<string, string> = {
  zakat: "Zakat",
  infaq: "Infaq",
  sedekah: "Sedekah",
  wakaf: "Wakaf",
  dskl: "DSKL",
};

function formatCompact(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(0)}Jt`;
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function ZiswafBreakdownChart({ data }: { data: ZiswafData[] }) {
  const chartData = data.map((d) => ({
    name: ZISWAF_LABELS[d.name] || d.name,
    value: d.amount,
    key: d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
          fontSize={11}
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={ZISWAF_COLORS[entry.key] || "#6b7280"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [formatCompact(Number(value)), "Jumlah"]}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
