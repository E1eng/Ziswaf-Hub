"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { recordDonationsBulk, type BulkDonationRow, type BulkImportResult } from "@/lib/donations";
import { toast } from "sonner";

interface Props {
  institutionId: string;
}

/**
 * Peta header (Indonesia & Inggris) → nama field internal yang dipakai
 * server action recordDonationsBulk. Membuat template ramah pengguna
 * sekaligus tetap menerima file lama berbahasa Inggris.
 */
const HEADER_MAP: Record<string, string> = {
  // jumlah
  jumlah: "amount",
  nominal: "amount",
  amount: "amount",
  // jenis dana
  jenis_dana: "fund_type",
  "jenis dana": "fund_type",
  dana: "fund_type",
  fund_type: "fund_type",
  // channel
  channel: "channel",
  kanal: "channel",
  metode: "channel",
  // nama donor
  nama_donor: "donor_name",
  "nama donor": "donor_name",
  nama: "donor_name",
  donor_name: "donor_name",
  // email
  email_donor: "donor_email",
  "email donor": "donor_email",
  email: "donor_email",
  donor_email: "donor_email",
  // hp
  hp_donor: "donor_phone",
  "hp donor": "donor_phone",
  hp: "donor_phone",
  telepon: "donor_phone",
  donor_phone: "donor_phone",
  // anonim
  anonim: "is_anonymous",
  anonymous: "is_anonymous",
  is_anonymous: "is_anonymous",
  // catatan
  catatan: "notes",
  keterangan: "notes",
  notes: "notes",
};

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase();
  return HEADER_MAP[key] ?? key;
}

const TEMPLATE_HEADERS = [
  "jumlah",
  "jenis_dana",
  "channel",
  "nama_donor",
  "email_donor",
  "hp_donor",
  "anonim",
  "catatan",
];

const TEMPLATE_SAMPLE = [
  ["1000000", "zakat", "transfer", "Ahmad Fauzi", "ahmad@example.com", "081234567890", "tidak", "Zakat maal"],
  ["500000", "infaq", "cash", "Siti Aminah", "", "", "tidak", "Infaq Jumat"],
  ["250000", "sedekah", "ewallet", "", "", "", "ya", "Donatur anonim"],
];

export function BulkImportDonations({ institutionId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<BulkDonationRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const aoa = [TEMPLATE_HEADERS, ...TEMPLATE_SAMPLE];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Lebar kolom biar rapi
    ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(14, h.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Donasi");
    XLSX.writeFile(wb, "template-donasi-ziswafhub.xlsx");
    toast.success("Template diunduh", { description: "Isi file lalu upload kembali di sini." });
  }

  async function handleFile(file: File) {
    setResult(null);
    setParseError(null);
    setParsedRows(null);
    setFileName(file.name);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        setParseError("File tidak memiliki sheet yang bisa dibaca.");
        return;
      }

      // Baca sebagai array-of-arrays supaya bisa normalisasi header dulu
      const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false });
      if (aoa.length < 2) {
        setParseError("File kosong atau hanya berisi header tanpa data.");
        return;
      }

      const rawHeaders = (aoa[0] ?? []).map((h) => String(h ?? ""));
      const headers = rawHeaders.map(normalizeHeader);
      if (!headers.includes("amount") || !headers.includes("fund_type")) {
        setParseError("Kolom wajib 'jumlah' dan 'jenis_dana' tidak ditemukan. Gunakan template.");
        return;
      }

      const rows: BulkDonationRow[] = [];
      for (let i = 1; i < aoa.length; i++) {
        const cells = aoa[i] ?? [];
        if (cells.every((c) => String(c ?? "").trim() === "")) continue;
        const obj: Record<string, unknown> = {};
        headers.forEach((key, idx) => {
          obj[key] = cells[idx];
        });
        rows.push(obj as unknown as BulkDonationRow);
      }

      if (rows.length === 0) {
        setParseError("Tidak ada baris data yang valid.");
        return;
      }
      setParsedRows(rows);
      toast.info(`${rows.length} baris terbaca`, { description: "Periksa lalu klik Import." });
    } catch (err) {
      setParseError(`Gagal membaca file: ${err instanceof Error ? err.message : "format tidak dikenali"}`);
    }
  }

  function reset() {
    setFileName(null);
    setParsedRows(null);
    setParseError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleImport() {
    if (!parsedRows || pending) return;
    startTransition(async () => {
      const res = await recordDonationsBulk(institutionId, parsedRows);
      setResult(res);
      if (res.success) {
        toast.success(`${res.inserted} donasi diimpor`, {
          description: res.failed > 0 ? `${res.failed} baris gagal — lihat detail.` : "Semua baris berhasil.",
        });
        router.refresh();
      } else {
        toast.error("Import gagal", { description: res.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="size-5" />
          Import Donasi Massal (Excel)
        </CardTitle>
        <CardDescription>
          Upload banyak donasi sekaligus dari file Excel (.xlsx). Unduh template dulu agar format kolom sesuai.
          Kolom: jumlah, jenis_dana, channel, nama_donor, email_donor, hp_donor, anonim (ya/tidak), catatan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="size-4 mr-1.5" />
            Unduh Template
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
          >
            <Upload className="size-4 mr-1.5" />
            Pilih File Excel
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {fileName && (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-muted/40">
            <span className="flex items-center gap-2 truncate">
              <FileSpreadsheet className="size-4 text-muted-foreground shrink-0" />
              <span className="truncate">{fileName}</span>
              {parsedRows && (
                <Badge variant="secondary" className="ml-1">{parsedRows.length} baris</Badge>
              )}
            </span>
            <button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        )}

        {parseError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {parsedRows && !result && (
          <Button type="button" onClick={handleImport} disabled={pending} className="w-full">
            {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Import {parsedRows.length} Donasi
          </Button>
        )}

        {result && (
          <div className="space-y-2 rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <span className="font-semibold">
                {result.inserted} donasi berhasil diimpor
              </span>
            </div>
            {result.failed > 0 && (
              <div className="text-sm">
                <p className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <AlertTriangle className="size-4" />
                  {result.failed} baris gagal:
                </p>
                <ul className="mt-1 max-h-40 overflow-y-auto text-xs text-muted-foreground space-y-0.5 pl-1">
                  {result.errors.map((e) => (
                    <li key={e.row}>
                      Baris {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Kode lacak sudah dibuat untuk tiap donasi. Email tidak dikirim otomatis pada mode
              massal — kirim manual dari tabel donasi bila perlu.
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Import file lain
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
