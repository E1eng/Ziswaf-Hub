"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play, CheckCircle, Ban } from "lucide-react";
import { updateProgramStatus } from "@/lib/programs";
import type { ProgramStatus } from "@/lib/constants/ziswaf";
import { toast } from "sonner";

interface Props {
  programId: string;
  currentStatus: ProgramStatus;
  hasBatches: boolean;
}

export function ProgramActions({ programId, currentStatus, hasBatches }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);

  function update(status: ProgramStatus, label: string) {
    startTransition(async () => {
      const res = await updateProgramStatus(programId, status);
      if (res.success) {
        toast.success(`Program ${label}`);
        router.refresh();
      } else {
        toast.error(`Gagal ${label}`, { description: res.error });
      }
    });
  }

  if (currentStatus === "DRAFT") {
    return (
      <Button onClick={() => update("ACTIVE", "diaktifkan")} disabled={pending}>
        {pending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Play className="size-4 mr-2" />}
        Aktifkan Program
      </Button>
    );
  }

  if (currentStatus === "ACTIVE") {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => update("COMPLETED", "diselesaikan")}
          disabled={pending}
        >
          {pending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle className="size-4 mr-2" />}
          Tandai Selesai
        </Button>
        {!hasBatches && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (!confirmCancel) {
                setConfirmCancel(true);
                setTimeout(() => setConfirmCancel(false), 3000);
                return;
              }
              update("CANCELED", "dibatalkan");
            }}
            disabled={pending}
          >
            <Ban className="size-4 mr-1" />
            {confirmCancel ? "Klik lagi untuk batal" : "Batalkan"}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
