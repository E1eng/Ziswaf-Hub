"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface PriorityData {
  name: string;
  score: number;
  level: string;
}

const LEVEL_COLORS: Record<string, string> = {
  sangat_tinggi: "#dc2626",
  tinggi: "#ea580c",
  sedang: "#ca8a04",
  rendah: "#16a34a",
};

export function PriorityChart({ data }: { data: PriorityData[] }) {
  const top10 = data.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={top10} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <XAxis type="number" domain={[0, 100]} fontSize={11} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value}`, "Skor Prioritas"]}
          labelStyle={{ fontWeight: 600 }}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <ReferenceLine x={75} stroke="#dc2626" strokeDasharray="3 3" label={{ value: "Kritis", fontSize: 10, fill: "#dc2626" }} />
        <ReferenceLine x={55} stroke="#ea580c" strokeDasharray="3 3" label={{ value: "Tinggi", fontSize: 10, fill: "#ea580c" }} />
        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
          {top10.map((entry, idx) => (
            <Cell key={idx} fill={LEVEL_COLORS[entry.level] || "#6b7280"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
