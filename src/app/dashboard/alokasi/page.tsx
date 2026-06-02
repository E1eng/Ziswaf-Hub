import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calculator, ClipboardList, Plus, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInstitution } from "@/lib/institution";
import { formatRupiah } from "@/lib/utils/format";
import {
  fundLabel,
  ASSISTANCE_TYPE_LABELS,
  asnafLabel,
  type AssistanceType,
} from "@/lib/constants/ziswaf";

export default async function AlokasiPage() {
  const ctx = await getCurrentInstitution();
  if (!ctx) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Alokasi Cerdas" description="Pilih program untuk mulai alokasi" />
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

  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, fund_type, assistance_type, target_asnaf, budget, period_start, period_end, status")
    .eq("institution_id", ctx.institutionId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Alokasi Cerdas"
        description="Pilih program aktif untuk menjalankan greedy knapsack ke mustahik"
      />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="size-5" />
              Bagaimana Alokasi Bekerja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>Buat program dengan fund_type & target_asnaf yang spesifik (constraint fiqih dijaga DB)</li>
              <li>Aktifkan program → buka detail program</li>
              <li>Wizard akan fetch mustahik APPROVED yang asnaf-nya match, lalu run dedup check ke seluruh lembaga</li>
              <li>Greedy knapsack pilih kandidat skor tertinggi sampai anggaran habis</li>
              <li>Override duplikat dengan alasan kalau perlu (audit logged)</li>
              <li>Konfirmasi → batch PROCESSING dibuat → update status ke DISBURSED nanti di halaman Penyaluran</li>
            </ol>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Program Aktif</h2>
            <p className="text-sm text-muted-foreground">Pilih program untuk membuka wizard alokasi</p>
          </div>
          <Link
            href="/dashboard/program/baru"
            className={buttonVariants({ variant: "outline" })}
          >
            <Plus className="size-4 mr-2" />
            Buat Program Baru
          </Link>
        </div>

        {!programs || programs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="size-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold">Belum ada program aktif</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Buat program baru lalu aktifkan, atau aktifkan program yang sudah ada di halaman Program.
              </p>
              <Link
                href="/dashboard/program"
                className={buttonVariants({ className: "mt-4" })}
              >
                Lihat Daftar Program
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {programs.map((p) => (
              <Link key={p.id} href={`/dashboard/program/${p.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base leading-tight">{p.name}</CardTitle>
                      <ArrowRight className="size-5 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-xs">{fundLabel(p.fund_type)}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {ASSISTANCE_TYPE_LABELS[p.assistance_type as AssistanceType] ?? p.assistance_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Asnaf: {(p.target_asnaf as string[]).map(asnafLabel).join(", ")}
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Anggaran</span>
                      <span className="font-semibold">{formatRupiah(p.budget)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Periode</span>
                      <span>
                        {new Date(p.period_start).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} –{" "}
                        {new Date(p.period_end).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
