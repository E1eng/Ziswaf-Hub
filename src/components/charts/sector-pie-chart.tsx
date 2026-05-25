"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SectorData {
  name: string;
  amount: number;
}

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(262, 83%, 58%)",
  "hsl(16, 90%, 50%)",
  "hsl(330, 81%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(198, 93%, 60%)",
];

export function SectorPieChart({ data }: { data: SectorData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="amount"
          nameKey="name"
          label={({ name, percent }) =>
            `${name?.toString().slice(0, 12)} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
          fontSize={11}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [
            `Rp ${Number(value).toLocaleString("id-ID")}`,
            "Jumlah",
          ]}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
