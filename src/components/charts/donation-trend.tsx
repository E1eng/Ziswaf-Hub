"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatRupiah } from "@/lib/utils/format";

interface Point {
  date: string;
  amount: number;
  count: number;
}

interface Props {
  data: Point[];
}

export function DonationTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
        Belum ada donasi
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="donAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(0 0% 45%)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(0 0% 45%)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}Jt`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
            return String(v);
          }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            fontSize: 12,
            border: "1px solid hsl(0 0% 90%)",
          }}
          formatter={(value, name) => {
            if (name === "amount") {
              return [formatRupiah(Number(value ?? 0)), "Total"];
            }
            return [String(value ?? "-"), String(name ?? "")];
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="hsl(160 84% 39%)"
          strokeWidth={2}
          fill="url(#donAmount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
