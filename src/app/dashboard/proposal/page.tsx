"use client";

import { useState, useEffect, useCallback } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ProposalForm } from "./proposal-form";

interface Proposal {
  id: string;
  nik: string;
  full_name: string;
  asnaf_category: string;
  priority_score: number;
  allocated_amount: number;
  status: string;
  source: string;
  metrics: Record<string, unknown>;
  submitted_at: string;
  kecamatan_id: string | null;
}

const ASNAF_LABELS: Record<string, string> = {
  fakir: "Fakir",
  miskin: "Miskin",
  amil: "Amil",
  mualaf: "Mualaf",
  riqab: "Riqab",
  gharimin: "Gharimin",
  fisabilillah: "Fisabilillah",
  ibnu_sabil: "Ibnu Sabil",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Menunggu", variant: "secondary" },
  APPROVED: { label: "Disetujui", variant: "default" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  DISBURSED: { label: "Disalurkan", variant: "outline" },
};

function maskNik(nik: string): string {
  if (nik.length < 8) return "****";
  return nik.slice(0, 4) + "****" + nik.slice(-4);
}

export default function ProposalPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, disbursed: 0, total: 0 });
  const [showForm, setShowForm] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("mustahik_proposals")
      .select("*")
      .order("priority_score", { ascending: false });

    if (filter !== "ALL") {
      query = query.eq("status", filter);
    }

    if (searchQuery.trim()) {
      query = query.ilike("full_name", `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query.limit(100);

    if (!error && data) {
      setProposals(data as Proposal[]);
    }
    setLoading(false);
  }, [filter, searchQuery]);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("mustahik_proposals")
      .select("status");

    if (data) {
      const pending = data.filter((d) => d.status === "PENDING").length;
      const approved = data.filter((d) => d.status === "APPROVED").length;
      const disbursed = data.filter((d) => d.status === "DISBURSED").length;
      setStats({ pending, approved, disbursed, total: data.length });
    }
  }, []);

  useEffect(() => {
    fetchProposals();
    fetchStats();
  }, [fetchProposals, fetchStats]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("proposals-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mustahik_proposals" }, (payload) => {
        const p = payload.new as { full_name?: string };
        toast.info("Proposal baru masuk", { description: p.full_name || "Data baru" });
        fetchProposals();
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProposals, fetchStats]);

  const handleAction = async (proposalId: string, action: "APPROVED" | "REJECTED") => {
    setProcessing(proposalId);
    const supabase = createClient();

    const { error } = await supabase
      .from("mustahik_proposals")
      .update({ status: action, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", proposalId);

    if (error) {
      toast.error("Gagal memproses", { description: error.message });
    } else {
      toast.success(action === "APPROVED" ? "Proposal disetujui" : "Proposal ditolak");
      // Log audit
      await (supabase as any).from("audit_ledger").insert({
        action: action === "APPROVED" ? "PROPOSAL_APPROVED" : "PROPOSAL_REJECTED",
        entity_type: "mustahik_proposal",
        entity_id: proposalId,
        payload: { action },
      });
      fetchProposals();
      fetchStats();
    }
    setProcessing(null);
  };

  const handleBulkApprove = async () => {
    const pendingIds = proposals.filter((p) => p.status === "PENDING").map((p) => p.id);
    if (pendingIds.length === 0) return;

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("mustahik_proposals")
      .update({ status: "APPROVED", reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in("id", pendingIds);

    if (error) {
      toast.error("Gagal approve massal", { description: error.message });
    } else {
      toast.success(`${pendingIds.length} proposal disetujui`);
      fetchProposals();
      fetchStats();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col">
      <div className="border-b px-8 py-5">
        <h1 className="text-2xl font-bold">E-Proposal Mustahik</h1>
        <p className="text-muted-foreground text-base mt-1">
          Kelola pengajuan bantuan berdasarkan NIK — satu individu, satu proposal aktif
        </p>
      </div>

      <main className="flex-1 p-8 space-y-6">
        {showForm && (
          <ProposalForm
            onSuccess={() => { setShowForm(false); fetchProposals(); fetchStats(); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-5 text-center">
              <FileText className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Proposal</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="pt-5 text-center">
              <Loader2 className="size-8 mx-auto text-amber-500 mb-2" />
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Menunggu Review</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-5 text-center">
              <CheckCircle className="size-8 mx-auto text-green-500 mb-2" />
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Disetujui</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="pt-5 text-center">
              <ShieldCheck className="size-8 mx-auto text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-blue-600">{stats.disbursed}</p>
              <p className="text-sm text-muted-foreground">Sudah Disalurkan</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Daftar Proposal</CardTitle>
                <CardDescription>Proposal diurutkan berdasarkan skor prioritas tertinggi</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {!showForm && (
                  <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5">
                    <Users className="size-4" />
                    Tambah Proposal
                  </Button>
                )}
                {filter === "PENDING" && proposals.length > 0 && (
                  <Button size="sm" onClick={handleBulkApprove} className="gap-1.5">
                    <CheckCircle className="size-4" />
                    Approve Semua ({proposals.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchProposals()}
                  className="pl-9"
                />
              </div>
              <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="size-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                  <SelectItem value="DISBURSED">Disalurkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="size-12 mx-auto mb-3 opacity-30" />
                <p>Tidak ada proposal ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>NIK (Masked)</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Asnaf</TableHead>
                      <TableHead className="text-center">Skor</TableHead>
                      <TableHead className="text-right">Estimasi Dana</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Sumber</TableHead>
                      {filter === "PENDING" && <TableHead className="text-center">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((p, idx) => {
                      const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{maskNik(p.nik)}</TableCell>
                          <TableCell className="font-medium">{p.full_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {ASNAF_LABELS[p.asnaf_category] || p.asnaf_category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${p.priority_score >= 60 ? "text-red-600" : p.priority_score >= 40 ? "text-amber-600" : "text-green-600"}`}>
                              {p.priority_score}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{formatRupiah(p.allocated_amount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs capitalize">{p.source.toLowerCase()}</Badge>
                          </TableCell>
                          {filter === "PENDING" && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  disabled={processing === p.id}
                                  onClick={() => handleAction(p.id, "APPROVED")}
                                >
                                  <CheckCircle className="size-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={processing === p.id}
                                  onClick={() => handleAction(p.id, "REJECTED")}
                                >
                                  <XCircle className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
