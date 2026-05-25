"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface MonthlyData {
  year: number | null;
  month: number | null;
  total_amount: number | null;
  total_donors?: number | null;
}

interface ChartPoint {
  label: string;
  "2024": number;
  "2023": number;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}Jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}Rb`;
  return String(value);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function MonthlyTrendChart({ data }: { data: MonthlyData[] }) {
  const chartData: ChartPoint[] = MONTHS.map((label, idx) => {
    const m = idx + 1;
    const cur = data.find((d) => d.year === 2024 && d.month === m);
    const prev = data.find((d) => d.year === 2023 && d.month === m);
    return {
      label,
      "2024": cur?.total_amount || 0,
      "2023": prev?.total_amount || 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad2024" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad2023" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
            <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={formatCompact} fontSize={11} tickLine={false} axisLine={false} width={50} />
        <Tooltip
          formatter={(value, name) => [
            `Rp ${Number(value).toLocaleString("id-ID")}`,
            `Tahun ${name}`,
          ]}
          contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }}
        />
        <Legend fontSize={12} />
        <Area
          type="monotone"
          dataKey="2023"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#grad2023)"
          name="2023"
        />
        <Area
          type="monotone"
          dataKey="2024"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#grad2024)"
          name="2024"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
