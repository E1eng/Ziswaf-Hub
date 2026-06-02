"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Search } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { fundLabel } from "@/lib/constants/ziswaf";
import { PaginationBar } from "@/components/ui/pagination-bar";

interface Donation {
  id: string;
  donation_code: string;
  amount: number;
  fund_type: string;
  donor_name: string | null;
  donor_email: string | null;
  is_anonymous: boolean;
  channel: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  received_at: string | null;
}

const PAGE_SIZE = 10;

function fmtDate(s: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentDonationsTable({ donations }: { donations: Donation[] }) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return donations;
    return donations.filter((d) => {
      return (
        d.donation_code.toLowerCase().includes(q) ||
        (d.donor_name?.toLowerCase().includes(q) ?? false) ||
        (d.donor_email?.toLowerCase().includes(q) ?? false) ||
        d.fund_type.toLowerCase().includes(q)
      );
    });
  }, [donations, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const sliceStart = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(sliceStart, sliceStart + PAGE_SIZE);

  function handleQuery(v: string) {
    setQuery(v);
    setPage(1);
  }

  if (donations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Belum ada donasi tercatat. Gunakan form di kiri untuk mencatat donasi pertama.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Cari kode, nama, email, atau jenis dana..."
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Tidak ada hasil untuk &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2 px-2">Kode</th>
                <th className="text-left py-2 px-2">Donor</th>
                <th className="text-left py-2 px-2">Jenis</th>
                <th className="text-right py-2 px-2">Jumlah</th>
                <th className="text-center py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 px-2 font-mono text-xs">{d.donation_code}</td>
                  <td className="py-2 px-2">
                    {d.is_anonymous ? (
                      <span className="text-muted-foreground italic">Anonim</span>
                    ) : (
                      d.donor_name ?? <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant="outline" className="text-xs">{fundLabel(d.fund_type)}</Badge>
                  </td>
                  <td className="py-2 px-2 text-right font-medium">{formatRupiah(d.amount)}</td>
                  <td className="py-2 px-2 text-center">
                    {!d.donor_email ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : d.email_sent_at ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Mail className="size-3" /> Terkirim
                      </Badge>
                    ) : d.email_error ? (
                      <Badge variant="destructive" className="text-xs">Gagal</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    )}
                  </td>
                  <td className="py-2 px-2 text-xs text-muted-foreground">
                    {fmtDate(d.received_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationBar
        page={safePage}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}
