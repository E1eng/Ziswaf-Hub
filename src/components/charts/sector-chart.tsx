"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SectorData {
  name: string;
  amount: number;
  beneficiaries: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(16, 90%, 50%)",
  "hsl(45, 93%, 47%)",
  "hsl(142, 71%, 45%)",
];

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}Jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}Rb`;
  return String(value);
}

export function SectorChart({ data }: { data: SectorData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
        <XAxis type="number" tickFormatter={formatCompact} fontSize={11} />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Jumlah"]}
          labelStyle={{ fontWeight: 600 }}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
