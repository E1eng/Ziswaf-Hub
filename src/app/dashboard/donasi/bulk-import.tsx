"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
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
    const csv = Papa.unparse({ fields: TEMPLATE_HEADERS, data: TEMPLATE_SAMPLE });
    // Prepend BOM so Excel opens UTF-8 correctly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-donasi-ziswafhub.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template diunduh", { description: "Isi file lalu upload kembali di sini." });
  }

  function handleFile(file: File) {
    setResult(null);
    setParseError(null);
    setParsedRows(null);
    setFileName(file.name);

    Papa.parse<BulkDonationRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => normalizeHeader(h),
      complete: (res) => {
        const rows = (res.data ?? []).filter(
          (r) => r && Object.values(r).some((v) => String(v ?? "").trim() !== "")
        );
        if (rows.length === 0) {
          setParseError("File kosong atau tidak ada baris data yang valid.");
          return;
        }
        const headers = res.meta.fields ?? [];
        if (!headers.includes("amount") || !headers.includes("fund_type")) {
          setParseError("Kolom wajib 'jumlah' dan 'jenis_dana' tidak ditemukan. Gunakan template.");
          return;
        }
        setParsedRows(rows);
        toast.info(`${rows.length} baris terbaca`, { description: "Periksa lalu klik Import." });
      },
      error: (err) => setParseError(`Gagal membaca file: ${err.message}`),
    });
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
          Import Donasi Massal (CSV)
        </CardTitle>
        <CardDescription>
          Upload banyak donasi sekaligus dari file CSV. Unduh template dulu agar format kolom sesuai.
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
            Pilih File CSV
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
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
