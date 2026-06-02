"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Settings, X } from "lucide-react";
import { updateMustahikLifecycle } from "@/lib/mustahik";
import { LIFECYCLE_STATUS, type LifecycleStatus } from "@/lib/constants/ziswaf";
import { toast } from "sonner";

interface Props {
  mustahikId: string;
  currentStatus: LifecycleStatus;
}

const STATUS_KEYS = Object.keys(LIFECYCLE_STATUS) as LifecycleStatus[];

export function LifecycleActions({ mustahikId, currentStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<LifecycleStatus>(currentStatus);
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newStatus === currentStatus && !reason.trim()) {
      toast.error("Pilih status baru atau isi alasan kalau status tidak berubah");
      return;
    }
    if (newStatus !== "active" && !reason.trim()) {
      toast.error(`Alasan wajib diisi saat mengubah status ke ${LIFECYCLE_STATUS[newStatus].label}`);
      return;
    }

    startTransition(async () => {
      const res = await updateMustahikLifecycle({
        mustahikId,
        status: newStatus,
        reason: reason.trim() || undefined,
      });
      if (res.success) {
        toast.success(`Status diubah ke ${LIFECYCLE_STATUS[newStatus].label}`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Gagal", { description: res.error });
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings className="size-4 mr-2" />
        Ubah Status
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background border-2 border-primary/30 rounded-xl p-4 space-y-3 w-full max-w-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Ubah Status Lifecycle</h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Status Baru</label>
        <Select value={newStatus} onValueChange={(v) => v && setNewStatus(v as LifecycleStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_KEYS.map((k) => {
              const cfg = LIFECYCLE_STATUS[k];
              return (
                <SelectItem key={k} value={k}>
                  <div>
                    <p className="font-medium">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">{cfg.description}</p>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">
          Alasan {newStatus !== "active" && <span className="text-destructive">*</span>}
        </label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Misal: Usaha sudah berhasil, tidak lagi mustahik"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Perubahan akan tercatat di audit ledger &amp; visible ke semua lembaga.
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="size-3 mr-2 animate-spin" />}
          Simpan
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
