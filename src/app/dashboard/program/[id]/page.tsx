"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/audit";
import {
  ASNAF_KEYS,
  AUDIT_ACTIONS,
  AUDIT_ENTITY,
  BENEFICIARY_STATUS,
  BeneficiaryStatus,
  asnafLabel,
  generateBatchCode,
} from "@/lib/constants/ziswaf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/format";
import { maskNik } from "@/lib/utils/privacy";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  UserPlus,
  Upload,
  Package,
} from "lucide-react";

interface Program {
  id: string;
  name: string;
  program_type: string;
  target_asnaf: string[];
  sector: string | null;
  budget: number;
  period: string | null;
  beneficiary_target: number;
  description: string | null;
  status: string;
}

interface Beneficiary {
  id: string;
  nik: string;
  full_name: string;
  asnaf_category: string;
  amount: number;
  status: string;
  duplicate_note: string | null;
  disbursement_batch_id: string | null;
}

interface ParsedRow {
  nik: string;
  full_name: string;
  asnaf_category: string;
  amount: number;
}

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [creatingBatch, setCreatingBatch] = useState(false);

  // Single add form
  const [showSingle, setShowSingle] = useState(false);
  const [sNik, setSNik] = useState("");
  const [sName, setSName] = useState("");
  const [sAsnaf, setSAsnaf] = useState("fakir");
  const [sAmount, setSAmount] = useState("");
  const [addingSingle, setAddingSingle] = useState(false);

  // Bulk paste
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkParsed, setBulkParsed] = useState<ParsedRow[]>([]);
  const [savingBulk, setSavingBulk] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: prog }, { data: bens }] = await Promise.all([
      supabase.from("programs").select("*").eq("id", programId).single(),
      supabase
        .from("program_beneficiaries")
        .select("id, nik, full_name, asnaf_category, amount, status, duplicate_note, disbursement_batch_id")
        .eq("program_id", programId)
        .order("created_at", { ascending: false }),
    ]);
    setProgram(prog as unknown as Program);
    setBeneficiaries((bens || []) as Beneficiary[]);
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount
    fetchData();
  }, [fetchData]);

  // ── Single Add ──
  const handleAddSingle = async () => {
    if (!sNik.trim() || sNik.trim().length !== 16) {
      toast.error("NIK harus 16 digit");
      return;
    }
    if (!sName.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    setAddingSingle(true);
    const supabase = createClient();
    const { error } = await supabase.from("program_beneficiaries").insert({
      program_id: programId,
      nik: sNik.trim(),
      full_name: sName.trim(),
      asnaf_category: sAsnaf,
      amount: parseFloat(sAmount) || 0,
    });

    if (error) {
      toast.error("Gagal menambah penerima", { description: error.message });
    } else {
      toast.success("Penerima ditambahkan");
      setSNik("");
      setSName("");
      setSAmount("");
      fetchData();
    }
    setAddingSingle(false);
  };

  // ── Bulk Parse ──
  const handleParseBulk = () => {
    const lines = bulkText.trim().split("\n").filter(Boolean);
    const parsed: ParsedRow[] = [];
    const validAsnaf = new Set<string>(ASNAF_KEYS);

    for (const line of lines) {
      const parts = line.split(/\t|;|,/).map((s) => s.trim());
      if (parts.length < 3) continue;
      const [nik, name, asnaf, amountStr] = parts;
      if (!nik || nik.length !== 16 || !name) continue;
      const lcAsnaf = asnaf?.toLowerCase() ?? "";
      parsed.push({
        nik,
        full_name: name,
        asnaf_category: validAsnaf.has(lcAsnaf) ? lcAsnaf : "fakir",
        amount: parseFloat(amountStr) || 0,
      });
    }

    if (parsed.length === 0) {
      toast.error("Tidak ada data valid. Format: NIK, Nama, Asnaf, Nominal");
    } else {
      setBulkParsed(parsed);
      toast.success(`${parsed.length} penerima berhasil di-parse`);
    }
  };

  const handleSaveBulk = async () => {
    if (bulkParsed.length === 0) return;
    setSavingBulk(true);
    const supabase = createClient();

    const rows = bulkParsed.map((b) => ({
      program_id: programId,
      nik: b.nik,
      full_name: b.full_name,
      asnaf_category: b.asnaf_category,
      amount: b.amount,
    }));

    const { error } = await supabase.from("program_beneficiaries").insert(rows);

    if (error) {
      toast.error("Gagal menyimpan", { description: error.message });
    } else {
      toast.success(`${rows.length} penerima disimpan`);
      setBulkText("");
      setBulkParsed([]);
      fetchData();
    }
    setSavingBulk(false);
  };

  // ── Validate Duplicates ──
  const handleValidate = async () => {
    const pending = beneficiaries.filter((b) => b.status === "PENDING");
    if (pending.length === 0) {
      toast.info("Tidak ada penerima berstatus PENDING");
      return;
    }

    setValidating(true);
    const supabase = createClient();
    const niks = pending.map((b) => b.nik);

    // Cross-program duplicates in program_beneficiaries
    const { data: crossDups } = await supabase
      .from("program_beneficiaries")
      .select("nik, program_id")
      .in("nik", niks)
      .neq("program_id", programId)
      .in("status", ["VALIDATED", "DISBURSED"]);

    // Resolve program names for the duplicates we found
    const otherProgramIds = Array.from(new Set((crossDups ?? []).map((d) => d.program_id)));
    const programNameById = new Map<string, string>();
    if (otherProgramIds.length > 0) {
      const { data: progs } = await supabase
        .from("programs")
        .select("id, name")
        .in("id", otherProgramIds);
      for (const p of progs ?? []) {
        programNameById.set(p.id, p.name);
      }
    }

    // Already disbursed via proposal channel
    const { data: proposalDups } = await supabase
      .from("mustahik_proposals")
      .select("nik")
      .in("nik", niks)
      .eq("status", "DISBURSED");

    const dupMap = new Map<string, string>();
    for (const d of crossDups ?? []) {
      const progName = programNameById.get(d.program_id) ?? "program lain";
      dupMap.set(d.nik, `Sudah terdaftar di: ${progName}`);
    }
    for (const d of proposalDups ?? []) {
      if (!dupMap.has(d.nik)) {
        dupMap.set(d.nik, "Sudah menerima via jalur proposal");
      }
    }

    // Intra-program duplicates
    const nikCount = new Map<string, number>();
    for (const b of beneficiaries) {
      nikCount.set(b.nik, (nikCount.get(b.nik) || 0) + 1);
    }
    for (const [nik, count] of nikCount) {
      if (count > 1 && !dupMap.has(nik)) {
        dupMap.set(nik, `NIK duplikat dalam program ini (${count}x)`);
      }
    }

    let validated = 0;
    let duplicates = 0;
    for (const b of pending) {
      const dupNote = dupMap.get(b.nik);
      if (dupNote) {
        await supabase
          .from("program_beneficiaries")
          .update({ status: "DUPLICATE", duplicate_note: dupNote })
          .eq("id", b.id);
        duplicates++;
      } else {
        await supabase.from("program_beneficiaries").update({ status: "VALIDATED" }).eq("id", b.id);
        validated++;
      }
    }

    toast.success(`Validasi selesai: ${validated} valid, ${duplicates} duplikat`);
    fetchData();
    setValidating(false);
  };

  // ── Create Batch ──
  const handleCreateBatch = async () => {
    const valid = beneficiaries.filter((b) => b.status === "VALIDATED");
    if (valid.length === 0) {
      toast.error("Tidak ada penerima tervalidasi");
      return;
    }

    setCreatingBatch(true);
    const supabase = createClient();
    const totalAmount = valid.reduce((s, b) => s + b.amount, 0);
    const code = generateBatchCode("BATCH");

    const { data: batch, error: batchErr } = await supabase
      .from("disbursement_batches")
      .insert({
        batch_code: code,
        total_amount: totalAmount,
        beneficiary_count: valid.length,
        fund_type: "ZISWAF",
        status: "PROCESSING",
        program_id: programId,
        kecamatan_summary: [],
      })
      .select("id")
      .single();

    if (batchErr || !batch) {
      toast.error("Gagal membuat batch", { description: batchErr?.message });
      setCreatingBatch(false);
      return;
    }

    const { error: linkErr } = await supabase
      .from("program_beneficiaries")
      .update({ status: "DISBURSED", disbursement_batch_id: batch.id })
      .in(
        "id",
        valid.map((b) => b.id)
      );

    if (linkErr) {
      toast.error("Gagal menautkan penerima ke batch");
    } else {
      toast.success(`Batch ${code} dibuat dengan ${valid.length} penerima`);
      await logAudit(supabase, {
        action: AUDIT_ACTIONS.PROGRAM_BATCH_CREATED,
        entityType: AUDIT_ENTITY.DISBURSEMENT_BATCH,
        entityId: batch.id,
        payload: { batch_code: code, program_id: programId, beneficiaries: valid.length, total: totalAmount },
      });
    }

    fetchData();
    setCreatingBatch(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Program tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/program")}>
          Kembali
        </Button>
      </div>
    );
  }

  const pendingCount = beneficiaries.filter((b) => b.status === "PENDING").length;
  const validCount = beneficiaries.filter((b) => b.status === "VALIDATED").length;
  const dupCount = beneficiaries.filter((b) => b.status === "DUPLICATE").length;
  const totalAllocated = beneficiaries.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/program")}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <Badge variant="secondary" className="capitalize">
              {program.program_type.toLowerCase()}
            </Badge>
            {program.sector && <span className="capitalize">{program.sector}</span>}
            {program.period && <span>{program.period}</span>}
            <span>Asnaf: {program.target_asnaf.map(asnafLabel).join(", ")}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">{formatRupiah(program.budget)}</p>
            <p className="text-xs text-muted-foreground">Anggaran</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">{formatRupiah(totalAllocated)}</p>
            <p className="text-xs text-muted-foreground">Teralokasi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">
              {beneficiaries.length}/{program.beneficiary_target}
            </p>
            <p className="text-xs text-muted-foreground">Penerima</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-green-600">{validCount}</p>
            <p className="text-xs text-muted-foreground">Tervalidasi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-amber-600">{dupCount}</p>
            <p className="text-xs text-muted-foreground">Duplikat</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowSingle(!showSingle);
            setShowBulk(false);
          }}
        >
          <UserPlus className="size-4 mr-2" /> Tambah Satu
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowBulk(!showBulk);
            setShowSingle(false);
          }}
        >
          <Upload className="size-4 mr-2" /> Bulk Paste
        </Button>
        {pendingCount > 0 && (
          <Button onClick={handleValidate} disabled={validating}>
            {validating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ShieldCheck className="size-4 mr-2" />}
            Validasi Duplikat ({pendingCount})
          </Button>
        )}
        {validCount > 0 && (
          <Button onClick={handleCreateBatch} disabled={creatingBatch} className="bg-green-600 hover:bg-green-700">
            {creatingBatch ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Package className="size-4 mr-2" />}
            Buat Batch ({validCount} orang)
          </Button>
        )}
      </div>

      {/* Single add form */}
      {showSingle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tambah Penerima</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <label className="text-xs font-medium mb-1 block">NIK (16 digit) *</label>
                <Input value={sNik} onChange={(e) => setSNik(e.target.value)} placeholder="3201XXXXXXXXXXXX" maxLength={16} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Nama Lengkap *</label>
                <Input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Ahmad Mustahik" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Asnaf</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={sAsnaf}
                  onChange={(e) => setSAsnaf(e.target.value)}
                >
                  {ASNAF_KEYS.map((a) => (
                    <option key={a} value={a}>
                      {asnafLabel(a)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Nominal (Rp)</label>
                <Input type="number" value={sAmount} onChange={(e) => setSAmount(e.target.value)} placeholder="500000" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddSingle} disabled={addingSingle} className="w-full">
                  {addingSingle ? <Loader2 className="size-4 animate-spin" /> : "Tambah"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk paste */}
      {showBulk && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk Paste dari Spreadsheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Format: <code className="bg-muted px-1 rounded">NIK, Nama, Asnaf, Nominal</code> — pisahkan dengan tab,
              koma, atau titik koma. Satu baris per penerima.
            </p>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm bg-background font-mono min-h-[120px]"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"3201010101010001\tAhmad\tfakir\t500000\n3201010101010002\tBudi\tmiskin\t500000"}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleParseBulk} disabled={!bulkText.trim()}>
                Parse & Preview
              </Button>
              {bulkParsed.length > 0 && (
                <Button onClick={handleSaveBulk} disabled={savingBulk}>
                  {savingBulk ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Simpan {bulkParsed.length} Penerima
                </Button>
              )}
            </div>
            {bulkParsed.length > 0 && (
              <div className="border rounded-md overflow-auto max-h-[200px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">NIK</th>
                      <th className="px-3 py-2 text-left">Nama</th>
                      <th className="px-3 py-2 text-left">Asnaf</th>
                      <th className="px-3 py-2 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkParsed.map((b, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5 font-mono">{maskNik(b.nik)}</td>
                        <td className="px-3 py-1.5">{b.full_name}</td>
                        <td className="px-3 py-1.5 capitalize">{asnafLabel(b.asnaf_category)}</td>
                        <td className="px-3 py-1.5 text-right">{formatRupiah(b.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Beneficiaries table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Penerima ({beneficiaries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {beneficiaries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada penerima. Tambahkan secara manual atau gunakan bulk paste.
            </p>
          ) : (
            <div className="border rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">NIK</th>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Asnaf</th>
                    <th className="px-3 py-2 text-right">Nominal</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-left">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map((b) => {
                    const si = BENEFICIARY_STATUS[b.status as BeneficiaryStatus] ?? BENEFICIARY_STATUS.PENDING;
                    const Icon = si.icon;
                    return (
                      <tr key={b.id} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">{maskNik(b.nik)}</td>
                        <td className="px-3 py-2">{b.full_name}</td>
                        <td className="px-3 py-2 capitalize">{asnafLabel(b.asnaf_category)}</td>
                        <td className="px-3 py-2 text-right">{formatRupiah(b.amount)}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Icon className={`size-4 ${si.color}`} />
                            <span className="text-xs">{si.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{b.duplicate_note || "—"}</td>
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
