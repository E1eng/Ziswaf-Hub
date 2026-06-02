"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/audit";
import {
  ASNAF_KEYS,
  AUDIT_ACTIONS,
  AUDIT_ENTITY,
  PROGRAM_STATUS,
  PROGRAM_TYPE,
  ProgramStatus,
  ProgramType,
  SECTOR_OPTIONS,
  asnafLabel,
} from "@/lib/constants/ziswaf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/format";
import { toast } from "sonner";
import {
  Plus,
  FolderOpen,
  CalendarClock,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";

const TYPE_ICON: Record<ProgramType, typeof CalendarClock> = {
  RUTIN: CalendarClock,
  PROPOSAL: FolderOpen,
  INSIDENTIL: Zap,
};

interface Program {
  id: string;
  name: string;
  program_type: string;
  target_asnaf: string[];
  sector: string | null;
  budget: number;
  period: string | null;
  beneficiary_target: number;
  status: string;
  created_at: string | null;
}

export default function ProgramListPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [programType, setProgramType] = useState<ProgramType>("RUTIN");
  const [selectedAsnaf, setSelectedAsnaf] = useState<string[]>([]);
  const [sector, setSector] = useState("");
  const [budget, setBudget] = useState("");
  const [period, setPeriod] = useState("");
  const [beneficiaryTarget, setBeneficiaryTarget] = useState("");
  const [description, setDescription] = useState("");

  const fetchPrograms = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("programs")
      .select("id, name, program_type, target_asnaf, sector, budget, period, beneficiary_target, status, created_at")
      .order("created_at", { ascending: false });
    setPrograms((data || []) as Program[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount
    fetchPrograms();
  }, [fetchPrograms]);

  const toggleAsnaf = (a: string) => {
    setSelectedAsnaf((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Nama program wajib diisi");
      return;
    }
    if (selectedAsnaf.length === 0) {
      toast.error("Pilih minimal 1 kategori asnaf");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { data: inst } = await supabase
      .from("institutions")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .single();

    const { data: created, error } = await supabase
      .from("programs")
      .insert({
        institution_id: inst?.id ?? null,
        name: name.trim(),
        program_type: programType,
        target_asnaf: selectedAsnaf,
        sector: sector || null,
        budget: parseFloat(budget) || 0,
        period: period || null,
        beneficiary_target: parseInt(beneficiaryTarget) || 0,
        description: description || null,
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Gagal membuat program", { description: error.message });
    } else {
      toast.success("Program berhasil dibuat");
      await logAudit(supabase, {
        action: AUDIT_ACTIONS.PROGRAM_CREATED,
        entityType: AUDIT_ENTITY.PROGRAM,
        entityId: created?.id,
        payload: { name: name.trim(), program_type: programType, target_asnaf: selectedAsnaf },
      });
      setShowCreate(false);
      setName("");
      setProgramType("RUTIN");
      setSelectedAsnaf([]);
      setSector("");
      setBudget("");
      setPeriod("");
      setBeneficiaryTarget("");
      setDescription("");
      fetchPrograms();
    }
    setSaving(false);
  };

  const active = programs.filter((p) => p.status === "ACTIVE").length;
  const totalBudget = programs.reduce((s, p) => s + (p.budget || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Program Penyaluran</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola program rutin, proposal, dan insidentil
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="size-4 mr-2" /> Buat Program
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{programs.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Program</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{active}</p>
            <p className="text-xs text-muted-foreground mt-1">Program Aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{formatRupiah(totalBudget)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Anggaran</p>
          </CardContent>
        </Card>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buat Program Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Nama Program *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Beasiswa Pendidikan Semester 1 2026"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tipe Program</label>
                <div className="flex gap-2">
                  {(Object.keys(PROGRAM_TYPE) as ProgramType[]).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={programType === t ? "default" : "outline"}
                      onClick={() => setProgramType(t)}
                    >
                      {PROGRAM_TYPE[t].label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Target Asnaf * (pilih satu atau lebih)
              </label>
              <div className="flex flex-wrap gap-2">
                {ASNAF_KEYS.map((a) => (
                  <Button
                    key={a}
                    size="sm"
                    variant={selectedAsnaf.includes(a) ? "default" : "outline"}
                    onClick={() => toggleAsnaf(a)}
                  >
                    {asnafLabel(a)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Sektor</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                >
                  <option value="">Pilih sektor</option>
                  {SECTOR_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Anggaran (Rp)</label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="500000000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Periode</label>
                <Input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2026-S1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Target Penerima</label>
                <Input
                  type="number"
                  value={beneficiaryTarget}
                  onChange={(e) => setBeneficiaryTarget(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Deskripsi</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[60px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat program..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                Simpan
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat...</div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="size-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">Belum ada program</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Buat program pertama untuk mulai menyalurkan dana ZISWAF
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => {
            const cfgType = PROGRAM_TYPE[p.program_type as ProgramType] ?? PROGRAM_TYPE.RUTIN;
            const cfgStatus = PROGRAM_STATUS[p.status as ProgramStatus] ?? PROGRAM_STATUS.DRAFT;
            const TypeIcon = TYPE_ICON[p.program_type as ProgramType] ?? CalendarClock;
            return (
              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/dashboard/program/${p.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg text-white ${cfgType.color}`}>
                      <TypeIcon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{p.name}</h3>
                        <Badge variant={cfgStatus.variant}>{cfgStatus.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{cfgType.label}</span>
                        {p.sector && <span className="capitalize">{p.sector}</span>}
                        <span>Asnaf: {p.target_asnaf.map(asnafLabel).join(", ")}</span>
                        {p.period && <span>{p.period}</span>}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold">{formatRupiah(p.budget)}</p>
                      <p className="text-xs text-muted-foreground">Target: {p.beneficiary_target} orang</p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
