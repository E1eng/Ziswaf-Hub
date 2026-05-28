import { PageHeader } from "@/components/page-header";
import { IndividualAllocationWizard } from "./individual-wizard";

export default function AlokasiPage() {
  return (
    <>
      <PageHeader
        title="Alokasi Cerdas"
        description="Seleksi otomatis penerima berdasarkan NIK & skor prioritas (Greedy Knapsack)"
      />
      <div className="p-6 space-y-8">
        <IndividualAllocationWizard />
      </div>
    </>
  );
}
