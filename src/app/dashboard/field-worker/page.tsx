import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInstitution } from "@/lib/institution";
import { FieldWorkerDashboard } from "./field-worker-dashboard";

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

export default async function FieldWorkerPage() {
  const ctx = await getCurrentInstitution();
  if (!ctx) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Field Worker" description="Kelola tim lapangan" />
        <main className="flex-1 p-8">
          <Card className="max-w-lg border-amber-200">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-600 mt-0.5" />
              <p className="text-sm">Akun belum terhubung ke lembaga.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (ctx.role === "reviewer") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("field_workers")
    .select("id, full_name, phone, telegram_chat_id, telegram_username, invite_code, invite_expires_at, status, activated_at, last_active_at, created_at")
    .eq("institution_id", ctx.institutionId)
    .order("created_at", { ascending: false });

  const fieldWorkers = (data ?? []) as FieldWorker[];

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Field Worker"
        description={`Kelola tim lapangan via Telegram bot — ${ctx.institutionName}`}
      />
      <main className="flex-1 p-6 lg:p-8">
        <FieldWorkerDashboard
          institutionId={ctx.institutionId}
          institutionName={ctx.institutionName}
          initialFieldWorkers={fieldWorkers}
        />
      </main>
    </div>
  );
}
