"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Package,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/lib/supabase/database.types";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY,
  BATCH_STATUS,
  BATCH_STATUS_FLOW,
  BatchStatus,
  fundLabel,
  nextBatchStatus,
} from "@/lib/constants/ziswaf";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/ui/pagination-bar";

const PAGE_SIZE = 10;

interface Batch {
  id: string;
  batch_code: string;
  total_amount: number;
  beneficiary_count: number;
  fund_type: string;
  status: string;
  created_at: string | null;
  verified_at: string | null;
  disbursed_at: string | null;
  received_at: string | null;
  institution_id: string | null;
  program_id: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PenyaluranPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "ALL">("ALL");

  const fetchBatches = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("disbursement_batches")
      .select("id, batch_code, total_amount, beneficiary_count, fund_type, status, created_at, verified_at, disbursed_at, received_at, institution_id, program_id")
      .order("created_at", { ascending: false });
    setBatches((data ?? []) as Batch[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch on mount
    fetchBatches();
  }, [fetchBatches]);

  const handleAdvanceStatus = async (batch: Batch) => {
    const next = nextBatchStatus(batch.status);
    if (!next) return;

    setUpdating(batch.id);
    const supabase = createClient();

    const now = new Date().toISOString();
    const updateData: Database["public"]["Tables"]["disbursement_batches"]["Update"] = { status: next };
    if (next === "VERIFIED") updateData.verified_at = now;
    if (next === "DISBURSED") updateData.disbursed_at = now;
    if (next === "RECEIVED") updateData.received_at = now;

    const { error } = await supabase
      .from("disbursement_batches")
      .update(updateData)
      .eq("id", batch.id);

    if (error) {
      toast.error("Gagal update status", { description: error.message });
    } else {
      toast.success(`Status diupdate ke ${BATCH_STATUS[next].label}`);
      await logAudit(supabase, {
        action: AUDIT_ACTIONS.BATCH_STATUS_UPDATED,
        entityType: AUDIT_ENTITY.BATCH,
        entityId: batch.id,
        institutionId: batch.institution_id ?? undefined,
        payload: { from: batch.status, to: next },
      });
      fetchBatches();
    }
    setUpdating(null);
  };

  const stats: Record<BatchStatus, number> = {
    PROCESSING: batches.filter((b) => b.status === "PROCESSING").length,
    VERIFIED: batches.filter((b) => b.status === "VERIFIED").length,
    DISBURSED: batches.filter((b) => b.status === "DISBURSED").length,
    RECEIVED: batches.filter((b) => b.status === "RECEIVED").length,
  };

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return batches;
    return batches.filter((b) => b.status === statusFilter);
  }, [batches, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const sliceStart = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(sliceStart, sliceStart + PAGE_SIZE);

  function setFilter(s: BatchStatus | "ALL") {
    setStatusFilter(s);
    setPage(1);
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Kelola Penyaluran"
        description="Update status batch — publik bisa lacak progress di /lacak"
      />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        {/* Status summary */}
        <div className="grid gap-4 md:grid-cols-4">
          {BATCH_STATUS_FLOW.map((s) => {
            const cfg = BATCH_STATUS[s];
            const Icon = cfg.icon;
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(isActive ? "ALL" : s)}
                className={`text-left rounded-xl transition-colors ${
                  isActive ? "ring-2 ring-primary" : ""
                }`}
              >
                <Card className={isActive ? "border-primary" : ""}>
                  <CardContent className="pt-5 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${cfg.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats[s]}</p>
                      <p className="text-sm text-muted-foreground">{cfg.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        {/* Batch table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-lg">Semua Batch</CardTitle>
                <CardDescription>
                  {statusFilter === "ALL"
                    ? "Klik tombol untuk memajukan status ke tahap berikutnya"
                    : `Menampilkan batch dengan status ${BATCH_STATUS[statusFilter].label}`}
                </CardDescription>
              </div>
              {statusFilter !== "ALL" && (
                <Button size="sm" variant="ghost" onClick={() => setFilter("ALL")}>
                  Tampilkan Semua
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="size-12 mx-auto mb-3 opacity-30" />
                <p>{batches.length === 0 ? "Belum ada batch penyaluran" : "Tidak ada batch dengan filter ini"}</p>
                {batches.length === 0 && (
                  <p className="text-sm">Buat batch via halaman Alokasi Cerdas atau Detail Program</p>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode Batch</TableHead>
                        <TableHead>Jenis Dana</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Penerima</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((b) => {
                        const cfg = BATCH_STATUS[b.status as BatchStatus] ?? BATCH_STATUS.PROCESSING;
                        const next = nextBatchStatus(b.status);
                        const nextCfg = next ? BATCH_STATUS[next] : null;
                        return (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono font-bold">{b.batch_code}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{fundLabel(b.fund_type)}</Badge>
                            </TableCell>
                            <TableCell>{formatRupiah(b.total_amount)}</TableCell>
                            <TableCell>{b.beneficiary_count} mustahik</TableCell>
                            <TableCell>
                              <Badge className={cfg.color}>{cfg.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(b.created_at)}</TableCell>
                            <TableCell>
                              {next && nextCfg ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5"
                                  disabled={updating === b.id}
                                  onClick={() => handleAdvanceStatus(b)}
                                >
                                  {updating === b.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <>
                                      <ArrowRight className="size-3" />
                                      {nextCfg.label}
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <CheckCircle className="size-4 text-green-600" />
                                  Selesai
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <PaginationBar
                  page={safePage}
                  pageSize={PAGE_SIZE}
                  totalItems={filtered.length}
                  onPageChange={setPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
