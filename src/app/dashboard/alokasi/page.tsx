import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AllocationWizard } from "./allocation-wizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatNumber } from "@/lib/utils/format";

interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  target_asnaf: string[];
  avg_cost_per_beneficiary: number;
  min_budget: number;
  duration_months: number;
  sector_id: string;
}

interface ProvinceOption {
  id: string;
  name: string;
}

interface AllocationPlan {
  id: string;
  name: string;
  status: string;
  total_budget: number;
  total_kecamatan: number | null;
  total_est_beneficiaries: number | null;
  created_at: string | null;
}

async function getPageData() {
  const supabase = await createClient();

  const [{ data: programs }, { data: provinces }, { data: plans }] = await Promise.all([
    supabase
      .from("program_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("regions")
      .select("id, name")
      .eq("type", "provinsi")
      .order("name"),
    supabase
      .from("allocation_plans")
      .select("id, name, status, total_budget, total_kecamatan, total_est_beneficiaries, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    programs: (programs || []) as ProgramTemplate[],
    provinces: (provinces || []) as ProvinceOption[],
    plans: (plans || []) as AllocationPlan[],
  };
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draf", variant: "secondary" },
  approved: { label: "Disetujui", variant: "default" },
  disbursed: { label: "Disalurkan", variant: "default" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

export default async function AlokasiPage() {
  const { programs, provinces, plans } = await getPageData();

  return (
    <>
      <PageHeader
        title="Alokasi Cerdas"
        description="Hitung rencana penyaluran optimal berdasarkan data kecamatan"
      />
      <div className="p-6 space-y-8">
        <AllocationWizard programs={programs} provinces={provinces} />

        {/* Plan History */}
        {plans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Riwayat Rencana Alokasi</CardTitle>
              <CardDescription className="text-sm">
                {plans.length} rencana alokasi yang pernah dibuat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plans.map((plan) => {
                  const st = STATUS_MAP[plan.status] || STATUS_MAP.draft;
                  return (
                    <div key={plan.id} className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-base">{plan.name}</p>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {plan.total_kecamatan || 0} kecamatan &middot; {formatNumber(plan.total_est_beneficiaries || 0, true)} penerima
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatRupiah(plan.total_budget)}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.created_at ? new Date(plan.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
