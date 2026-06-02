import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { getCurrentInstitution } from "@/lib/institution";
import { ProgramForm } from "./program-form";

export default async function NewProgramPage() {
  const ctx = await getCurrentInstitution();

  if (!ctx) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Buat Program Baru" description="Setup program multi-fund untuk alokasi" />
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

  // Hanya admin/supervisor boleh buat program
  if (ctx.role === "reviewer") {
    redirect("/dashboard/program");
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Buat Program Baru"
        description={`Setup program untuk ${ctx.institutionName}`}
      />
      <main className="flex-1 p-6 lg:p-8 max-w-3xl">
        <ProgramForm institutionId={ctx.institutionId} />
      </main>
    </div>
  );
}
