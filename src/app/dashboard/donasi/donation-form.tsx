"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { recordDonation } from "@/lib/donations";
import {
  FUND_TYPES,
  fundLabel,
  DONATION_CHANNELS,
  DONATION_CHANNEL_LABELS,
  type FundType,
  type DonationChannel,
} from "@/lib/constants/ziswaf";
import { formatRupiah } from "@/lib/utils/format";
import { toast } from "sonner";

interface Props {
  institutionId: string;
}

export function DonationForm({ institutionId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [fundType, setFundType] = useState<FundType>("zakat");
  const [channel, setChannel] = useState<DonationChannel | "">("transfer");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notes, setNotes] = useState("");

  const [result, setResult] = useState<{
    code: string;
    emailSent: boolean;
  } | null>(null);

  const numAmount = Number(amount) || 0;
  const canSubmit = numAmount > 0 && fundType;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;

    // Validate email format if provided
    if (donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      toast.error("Format email tidak valid");
      return;
    }

    startTransition(async () => {
      const res = await recordDonation({
        institutionId,
        amount: numAmount,
        fundType,
        channel: channel || null,
        donorName: donorName.trim() || null,
        donorEmail: donorEmail.trim() || null,
        donorPhone: donorPhone.trim() || null,
        isAnonymous,
        notes: notes.trim() || null,
      });

      if (!res.success) {
        toast.error("Gagal menyimpan donasi", { description: res.error });
        return;
      }

      setResult({
        code: res.donationCode!,
        emailSent: res.emailSent ?? false,
      });

      toast.success("Donasi tercatat", {
        description: res.emailSent
          ? "Kode lacak telah dikirim ke email donor"
          : `Kode: ${res.donationCode}`,
      });

      // Reset form
      setAmount("");
      setDonorName("");
      setDonorEmail("");
      setDonorPhone("");
      setIsAnonymous(false);
      setNotes("");

      // Refresh server data (recent donations + pool)
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="size-5" />
          Catat Donasi Masuk
        </CardTitle>
        <CardDescription>
          Sistem akan generate kode lacak unik & otomatis kirim ke email donor (jika diisi).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="mb-4 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-5" />
              <span className="font-semibold">Donasi tercatat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Kode lacak:</span>
              <code className="font-mono font-bold text-emerald-800 text-base">{result.code}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.code);
                  toast.success("Kode disalin");
                }}
                className="text-xs text-emerald-600 hover:underline"
              >
                Salin
              </button>
            </div>
            {result.emailSent ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Mail className="size-3" /> Email kode terkirim
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Email tidak dikirim (donor anonim atau email tidak diisi)
              </p>
            )}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-xs text-emerald-700 hover:underline"
            >
              Catat donasi lain
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">
              Jumlah Donasi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              placeholder="500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {numAmount > 0 && (
              <p className="text-xs text-muted-foreground">{formatRupiah(numAmount)}</p>
            )}
          </div>

          {/* Fund type */}
          <div className="space-y-1.5">
            <Label>
              Jenis Dana <span className="text-destructive">*</span>
            </Label>
            <Select value={fundType} onValueChange={(v) => v && setFundType(v as FundType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUND_TYPES.map((ft) => (
                  <SelectItem key={ft} value={ft}>
                    {fundLabel(ft)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={channel || ""} onValueChange={(v) => setChannel((v as DonationChannel) || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih channel..." />
              </SelectTrigger>
              <SelectContent>
                {DONATION_CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {DONATION_CHANNEL_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="size-4 rounded border-border"
            />
            <span>Donasi anonim (data donor tidak dicatat)</span>
          </label>

          {!isAnonymous && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="donor-name">Nama Donor</Label>
                <Input
                  id="donor-name"
                  placeholder="Bapak/Ibu Ahmad"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="donor-email">Email Donor</Label>
                <Input
                  id="donor-email"
                  type="email"
                  placeholder="ahmad@example.com"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Kalau diisi, kode lacak otomatis dikirim ke email ini.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="donor-phone">No. HP (opsional)</Label>
                <Input
                  id="donor-phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <textarea
              id="notes"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[60px]"
              placeholder="Catatan internal lembaga..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={!canSubmit || pending} className="w-full">
            {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Catat Donasi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
