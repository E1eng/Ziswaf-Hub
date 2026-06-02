import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { Shield, Scale, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInstitution } from "@/lib/institution";
import { ProfileForm } from "./profile-form";

interface InstitutionRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  status: string | null;
  level: string;
  region_name: string | null;
  type_name: string | null;
}

export default async function PengaturanPage() {
  const ctx = await getCurrentInstitution();

  if (!ctx) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Pengaturan" description="Profil lembaga & info platform" />
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
  const { data } = await supabase
    .from("institutions")
    .select(`
      id, name, email, phone, address, website, bank_name,
      bank_account_name, bank_account_number, status, level,
      regions(name),
      institution_types(name)
    `)
    .eq("id", ctx.institutionId)
    .single();

  type Raw = Omit<InstitutionRow, "region_name" | "type_name"> & {
    regions: { name: string } | null;
    institution_types: { name: string } | null;
  };
  const rawInst = data as unknown as Raw | null;

  const inst: InstitutionRow | null = rawInst
    ? {
        ...rawInst,
        region_name: rawInst.regions?.name ?? null,
        type_name: rawInst.institution_types?.name ?? null,
      }
    : null;

  if (!inst) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Pengaturan" description="Profil lembaga" />
        <main className="flex-1 p-8">
          <Card className="max-w-lg border-amber-200">
            <CardContent className="pt-6">
              <p className="text-sm">Data lembaga tidak ditemukan.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const canEdit = ctx.role === "admin";

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pengaturan"
        description={`Profil lembaga & info platform — ${ctx.institutionName}`}
      />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl">
        {/* Profile editor / display */}
        {canEdit ? (
          <ProfileForm initial={inst} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profil Lembaga</CardTitle>
              <CardDescription>Hanya admin yang bisa mengedit profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ProfileRow label="Nama" value={inst.name} />
              <ProfileRow label="Email" value={inst.email} />
              <ProfileRow label="No. HP" value={inst.phone} />
              <ProfileRow label="Alamat" value={inst.address} />
              <ProfileRow label="Website" value={inst.website} />
              <ProfileRow label="Bank" value={inst.bank_name} />
              <ProfileRow label="No. Rekening" value={inst.bank_account_number} />
              <ProfileRow label="Atas Nama" value={inst.bank_account_name} />
            </CardContent>
          </Card>
        )}

        {/* Info readonly */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Lembaga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary" className="text-sm">
                <Shield className="size-3.5 mr-1" />
                {inst.status === "active" ? "Aktif" : inst.status}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level</span>
              <span className="font-medium capitalize">{inst.level.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipe Lembaga</span>
              <span className="font-medium">{inst.type_name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wilayah</span>
              <span className="font-medium">{inst.region_name ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="size-5" />
              <CardTitle className="text-base">Kepatuhan Regulasi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { law: "UU 23/2011", desc: "Pengelolaan Zakat" },
                { law: "UU 41/2004", desc: "Wakaf" },
                { law: "UU 27/2022", desc: "Perlindungan Data Pribadi (PDP)" },
                { law: "PP 71/2019", desc: "Penyelenggaraan Sistem & Transaksi Elektronik" },
              ].map((item) => (
                <div key={item.law} className="flex items-center gap-3 py-1.5">
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {item.law}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tentang */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tentang Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versi</span>
                <span className="font-medium">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arsitektur</span>
                <span className="font-medium">NIK Targeting</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stack</span>
                <span className="font-medium">Next.js + Supabase</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Privacy</span>
                <span className="font-medium">NIK Masked + Audit Ledger</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-all">{value || "—"}</span>
    </div>
  );
}
