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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  UserPlus,
  Send,
  Copy,
  RefreshCw,
  Ban,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
} from "lucide-react";
import {
  inviteFieldWorker,
  revokeFieldWorker,
  regenerateInviteCode,
} from "@/lib/field-workers";
import { toast } from "sonner";

interface FieldWorker {
  id: string;
  full_name: string;
  phone: string | null;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  invite_code: string | null;
  invite_expires_at: string | null;
  status: string;
  activated_at: string | null;
  last_active_at: string | null;
  created_at: string | null;
}

interface Props {
  institutionId: string;
  institutionName: string;
  initialFieldWorkers: FieldWorker[];
}

const STATUS_CONFIG = {
  pending: { label: "Menunggu Aktivasi", color: "bg-amber-100 text-amber-800", icon: Clock },
  active: { label: "Aktif", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  revoked: { label: "Dicabut", color: "bg-red-100 text-red-800", icon: XCircle },
} as const;

function formatDate(s: string | null): string {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FieldWorkerDashboard({ institutionId, initialFieldWorkers }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [latestInvite, setLatestInvite] = useState<{
    fullName: string;
    inviteCode: string;
    inviteUrl: string;
    expiresAt: string;
  } | null>(null);

  const stats = {
    pending: initialFieldWorkers.filter((f) => f.status === "pending").length,
    active: initialFieldWorkers.filter((f) => f.status === "active").length,
    revoked: initialFieldWorkers.filter((f) => f.status === "revoked").length,
  };

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pending) return;

    startTransition(async () => {
      const res = await inviteFieldWorker({
        institutionId,
        fullName: name.trim(),
        phone: phone.trim() || undefined,
      });

      if (!res.success) {
        toast.error("Gagal membuat invite", { description: res.error });
        return;
      }

      setLatestInvite({
        fullName: name.trim(),
        inviteCode: res.inviteCode!,
        inviteUrl: res.inviteUrl!,
        expiresAt: res.expiresAt!,
      });
      setName("");
      setPhone("");
      setShowForm(false);
      toast.success(`Invite untuk ${name} berhasil dibuat`);
      router.refresh();
    });
  }

  function handleRevoke(id: string, name: string) {
    if (!confirm(`Cabut akses ${name}? Field worker tidak bisa lagi submit via Telegram bot.`)) return;
    startTransition(async () => {
      const res = await revokeFieldWorker(id);
      if (res.success) {
        toast.success(`${name} dicabut aksesnya`);
        router.refresh();
      } else {
        toast.error("Gagal", { description: res.error });
      }
    });
  }

  function handleRegenerate(id: string, fwName: string) {
    if (!confirm(`Generate kode baru untuk ${fwName}? Kode lama akan tidak berlaku.`)) return;
    startTransition(async () => {
      const res = await regenerateInviteCode(id);
      if (res.success) {
        setLatestInvite({
          fullName: fwName,
          inviteCode: res.inviteCode!,
          inviteUrl: res.inviteUrl!,
          expiresAt: res.expiresAt!,
        });
        toast.success("Invite code di-regenerate");
        router.refresh();
      } else {
        toast.error("Gagal", { description: res.error });
      }
    });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin`);
  }

  return (
    <div className="space-y-6">
      {/* Latest invite display */}
      {latestInvite && (
        <Card className="border-2 border-emerald-300 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="size-5 text-emerald-700" />
              Invite untuk {latestInvite.fullName} berhasil dibuat
            </CardTitle>
            <CardDescription>
              Kirim link atau kode di bawah ini ke field worker via WhatsApp.
              Mereka tinggal klik link untuk aktivasi via Telegram bot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-background border rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Link Aktivasi</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono break-all flex-1">{latestInvite.inviteUrl}</code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(latestInvite.inviteUrl, "Link aktivasi")}
                  >
                    <Copy className="size-3.5 mr-1" />
                    Salin
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Kode Manual (kalau link tidak bisa)</p>
                <div className="flex items-center gap-2">
                  <code className="text-base font-mono font-bold tracking-wider">
                    /start {latestInvite.inviteCode}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`/start ${latestInvite.inviteCode}`, "Kode")}
                  >
                    <Copy className="size-3.5 mr-1" />
                    Salin
                  </Button>
                </div>
              </div>
              <p className="text-xs text-amber-700">
                ⏰ Kadaluarsa: {formatDate(latestInvite.expiresAt)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLatestInvite(null)}>
              Tutup
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-5 text-center">
          <CheckCircle2 className="size-7 mx-auto text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          <p className="text-sm text-muted-foreground">Aktif</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <Clock className="size-7 mx-auto text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Menunggu Aktivasi</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <XCircle className="size-7 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{stats.revoked}</p>
          <p className="text-sm text-muted-foreground">Dicabut</p>
        </CardContent></Card>
      </div>

      {/* Bot info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="size-5" />
            Cara Kerja Telegram Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            1. Klik <strong>Undang Field Worker</strong> dan isi nama tim lapangan Anda
          </p>
          <p>
            2. Sistem generate <code className="text-xs bg-muted px-1.5 py-0.5 rounded">FW-XXXXXX</code> kode
          </p>
          <p>
            3. Bagikan link Telegram ke field worker via WhatsApp/SMS
          </p>
          <p>
            4. Field worker klik link → otomatis bind ke <code className="text-xs bg-muted px-1.5 py-0.5 rounded">@ziswafhub_bot</code>
          </p>
          <p>
            5. Setelah aktif, mereka bisa submit assessment mustahik via:
            {" "}<code className="text-xs bg-muted px-1.5 py-0.5 rounded">/proposal</code>
          </p>
          <p className="text-xs italic mt-3">
            * Bot worker perlu di-deploy terpisah (Phase 4 implementation). Schema & API sudah siap.
          </p>
        </CardContent>
      </Card>

      {/* Form invite */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="size-5" />
              Undang Field Worker Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fname">Nama Lengkap *</Label>
                  <Input
                    id="fname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmad Surveyor"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fphone">No. HP (opsional)</Label>
                  <Input
                    id="fphone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t">
                <Button type="submit" disabled={!name.trim() || pending}>
                  {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Generate Invite
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)}>
            <UserPlus className="size-4 mr-2" />
            Undang Field Worker
          </Button>
        </div>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Field Worker</CardTitle>
        </CardHeader>
        <CardContent>
          {initialFieldWorkers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada field worker. Undang tim lapangan untuk mulai input assessment via Telegram.
            </p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left p-2">Nama</th>
                    <th className="text-left p-2">No. HP</th>
                    <th className="text-left p-2">Telegram</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-left p-2">Aktif Terakhir</th>
                    <th className="text-right p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {initialFieldWorkers.map((fw) => {
                    const cfg = STATUS_CONFIG[fw.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    const isExpired = fw.invite_expires_at &&
                      new Date(fw.invite_expires_at) < new Date() &&
                      fw.status === "pending";

                    return (
                      <tr key={fw.id} className="border-b last:border-0">
                        <td className="p-2 font-medium">{fw.full_name}</td>
                        <td className="p-2 text-muted-foreground">{fw.phone ?? "—"}</td>
                        <td className="p-2 text-muted-foreground text-xs">
                          {fw.telegram_username ? (
                            <span>@{fw.telegram_username}</span>
                          ) : fw.telegram_chat_id ? (
                            <span className="font-mono">chat: {String(fw.telegram_chat_id).slice(0, 8)}...</span>
                          ) : (
                            <span className="italic">belum terhubung</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Badge className={`${cfg.color} text-xs gap-1`}>
                              <Icon className="size-3" />
                              {cfg.label}
                            </Badge>
                            {isExpired && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                Kadaluarsa
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">
                          {fw.last_active_at ? formatDate(fw.last_active_at) : "—"}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {fw.status === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={pending}
                                onClick={() => handleRegenerate(fw.id, fw.full_name)}
                                title="Regenerate kode"
                              >
                                <RefreshCw className="size-3.5" />
                              </Button>
                            )}
                            {fw.status !== "revoked" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                disabled={pending}
                                onClick={() => handleRevoke(fw.id, fw.full_name)}
                                title="Cabut akses"
                              >
                                <Ban className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
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
