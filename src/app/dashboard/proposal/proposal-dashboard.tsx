"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  FileText,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { maskNik } from "@/lib/utils/privacy";
import { createClient } from "@/lib/supabase/client";
import { approveAssessment, rejectAssessment, bulkApproveAssessments } from "@/lib/assessments";
import {
  asnafLabel,
  ASSESSMENT_STATUS,
  type AssessmentStatus,
} from "@/lib/constants/ziswaf";
import { toast } from "sonner";
import { AssessmentForm } from "./assessment-form";

interface Assessment {
  id: string;
  asnaf_category: string;
  priority_score: number;
  estimated_amount: number;
  status: string;
  source: string;
  submitted_at: string;
  metrics: { monthly_income?: number; dependents?: number; housing?: string };
  mustahik_id: string;
  mustahik: { nik: string; full_name: string; lifecycle_status: string } | null;
}

interface Props {
  institutionId: string;
  institutionName: string;
}

export function ProposalDashboard({ institutionId, institutionName }: Props) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [showForm, setShowForm] = useState(false);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("mustahik_assessments")
      .select(`
        id, asnaf_category, priority_score, estimated_amount, status, source,
        submitted_at, metrics, mustahik_id,
        mustahik:mustahik_registry!inner(nik, full_name, lifecycle_status)
      `)
      .eq("institution_id", institutionId)
      .order("priority_score", { ascending: false })
      .order("submitted_at", { ascending: false })
      .limit(200);

    if (filter !== "ALL") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      let rows = data as unknown as Assessment[];
      // Client-side search by name (server doesn't support join filter well via REST)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        rows = rows.filter((r) => r.mustahik?.full_name.toLowerCase().includes(q));
      }
      setAssessments(rows);
    }
    setLoading(false);
  }, [filter, searchQuery, institutionId]);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("mustahik_assessments")
      .select("status")
      .eq("institution_id", institutionId);

    if (data) {
      setStats({
        pending: data.filter((d) => d.status === "PENDING").length,
        approved: data.filter((d) => d.status === "APPROVED").length,
        rejected: data.filter((d) => d.status === "REJECTED").length,
        total: data.length,
      });
    }
  }, [institutionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch on mount
    fetchAssessments();
    fetchStats();
  }, [fetchAssessments, fetchStats]);

  // Realtime: re-fetch saat ada insert baru (dari Telegram bot misalnya)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("assessments-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mustahik_assessments",
          filter: `institution_id=eq.${institutionId}`,
        },
        () => {
          toast.info("Assessment baru masuk", { description: "Daftar diperbarui" });
          fetchAssessments();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAssessments, fetchStats, institutionId]);

  const handleAction = (id: string, action: "APPROVE" | "REJECT") => {
    setProcessing(id);
    startTransition(async () => {
      const res = action === "APPROVE"
        ? await approveAssessment(id)
        : await rejectAssessment(id);

      if (res.success) {
        toast.success(action === "APPROVE" ? "Assessment disetujui" : "Assessment ditolak");
        fetchAssessments();
        fetchStats();
      } else {
        toast.error("Gagal", { description: res.error });
      }
      setProcessing(null);
    });
  };

  const handleBulkApprove = () => {
    const ids = assessments.filter((a) => a.status === "PENDING").map((a) => a.id);
    if (ids.length === 0) return;

    if (!confirm(`Approve ${ids.length} assessment sekaligus?`)) return;

    startTransition(async () => {
      const res = await bulkApproveAssessments(ids);
      if (res.success) {
        toast.success(`${res.count} assessment disetujui`);
        fetchAssessments();
        fetchStats();
      } else {
        toast.error("Gagal bulk approve", { description: res.error });
      }
    });
  };

  return (
    <div className="space-y-6">
      {showForm && (
        <AssessmentForm
          institutionId={institutionId}
          onSuccess={() => {
            setShowForm(false);
            fetchAssessments();
            fetchStats();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-5 text-center">
          <FileText className="size-7 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Assessment</p>
        </CardContent></Card>
        <Card className="border-amber-200"><CardContent className="pt-5 text-center">
          <Loader2 className="size-7 mx-auto text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Menunggu Review</p>
        </CardContent></Card>
        <Card className="border-emerald-200"><CardContent className="pt-5 text-center">
          <CheckCircle className="size-7 mx-auto text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
          <p className="text-sm text-muted-foreground">Disetujui</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <ShieldCheck className="size-7 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{stats.rejected}</p>
          <p className="text-sm text-muted-foreground">Ditolak</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Daftar Assessment</CardTitle>
              <CardDescription>
                Diurutkan berdasarkan skor prioritas tertinggi · {institutionName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!showForm && (
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                  <UserPlus className="size-4 mr-2" />
                  Tambah Manual
                </Button>
              )}
              {filter === "PENDING" && assessments.length > 0 && (
                <Button size="sm" onClick={handleBulkApprove} disabled={pending}>
                  <CheckCircle className="size-4 mr-2" />
                  Approve Semua ({assessments.length})
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
                placeholder="Cari nama mustahik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchAssessments()}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <Filter className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu Review</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="ARCHIVED">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="size-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada assessment ditemukan</p>
              {filter === "PENDING" && (
                <p className="text-xs mt-1">
                  Tambah manual atau tunggu submission dari field worker via Telegram bot
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left p-2 w-8">#</th>
                    <th className="text-left p-2">NIK</th>
                    <th className="text-left p-2">Nama</th>
                    <th className="text-left p-2">Asnaf</th>
                    <th className="text-center p-2">Skor</th>
                    <th className="text-right p-2">Estimasi Dana</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Sumber</th>
                    {filter === "PENDING" && <th className="text-center p-2">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a, idx) => {
                    const st = ASSESSMENT_STATUS[a.status as AssessmentStatus] ?? ASSESSMENT_STATUS.PENDING;
                    return (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="p-2 text-muted-foreground">{idx + 1}</td>
                        <td className="p-2 font-mono text-xs">{maskNik(a.mustahik?.nik ?? "")}</td>
                        <td className="p-2 font-medium">{a.mustahik?.full_name ?? "—"}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">{asnafLabel(a.asnaf_category)}</Badge>
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`font-bold ${
                              a.priority_score >= 60
                                ? "text-red-600"
                                : a.priority_score >= 40
                                ? "text-amber-600"
                                : "text-green-600"
                            }`}
                          >
                            {a.priority_score}
                          </span>
                        </td>
                        <td className="p-2 text-right">{formatRupiah(a.estimated_amount)}</td>
                        <td className="p-2 text-center">
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className="text-xs capitalize">
                            {a.source.toLowerCase()}
                          </Badge>
                        </td>
                        {filter === "PENDING" && (
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                                disabled={processing === a.id}
                                onClick={() => handleAction(a.id, "APPROVE")}
                              >
                                <CheckCircle className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                disabled={processing === a.id}
                                onClick={() => handleAction(a.id, "REJECT")}
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
