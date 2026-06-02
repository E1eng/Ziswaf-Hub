import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber } from "@/lib/utils/format";
import { Building2, ArrowLeft, Mail, Phone, MapPin } from "lucide-react";

interface InstitutionRow {
  id: string;
  name: string;
  level: string;
  status: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  region: { name: string } | null;
  type: { name: string; code: string } | null;
}

interface InstitutionWithStats extends InstitutionRow {
  total_donated: number;
  total_disbursed: number;
}

async function getDirectoryData(): Promise<InstitutionWithStats[]> {
  const supabase = await createClient();

  const [{ data: institutions }, { data: pool }] = await Promise.all([
    supabase
      .from("institutions")
      .select(`
        id, name, level, status, email, phone, bank_name,
        regions(name),
        institution_types(name, code)
      `)
      .eq("status", "active")
      .order("name"),
    supabase.from("fund_pool_view").select("institution_id, total_donated, total_disbursed"),
  ]);

  const poolMap = new Map<string, { donated: number; disbursed: number }>();
  for (const p of pool ?? []) {
    if (!p.institution_id) continue;
    const cur = poolMap.get(p.institution_id) ?? { donated: 0, disbursed: 0 };
    cur.donated += Number(p.total_donated ?? 0);
    cur.disbursed += Number(p.total_disbursed ?? 0);
    poolMap.set(p.institution_id, cur);
  }

  type Raw = {
    id: string;
    name: string;
    level: string;
    status: string | null;
    email: string | null;
    phone: string | null;
    bank_name: string | null;
    regions: { name: string } | null;
    institution_types: { name: string; code: string } | null;
  };

  return ((institutions ?? []) as unknown as Raw[]).map((inst) => {
    const stats = poolMap.get(inst.id) ?? { donated: 0, disbursed: 0 };
    return {
      id: inst.id,
      name: inst.name,
      level: inst.level,
      status: inst.status,
      email: inst.email,
      phone: inst.phone,
      bank_name: inst.bank_name,
      region: inst.regions,
      type: inst.institution_types,
      total_donated: stats.donated,
      total_disbursed: stats.disbursed,
    };
  });
}

const LEVEL_LABEL: Record<string, string> = {
  nasional: "Nasional",
  provinsi: "Provinsi",
  kabupaten_kota: "Kabupaten/Kota",
};

export default async function LembagaPage() {
  const data = await getDirectoryData();

  const totalInst = data.length;
  const totalDonated = data.reduce((s, d) => s + d.total_donated, 0);
  const totalDisbursed = data.reduce((s, d) => s + d.total_disbursed, 0);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50/30 to-white">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
            <ArrowLeft className="size-5" />
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-base font-bold">Z</span>
            </div>
            ZISWAF Hub
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/lembaga" className="font-medium">Direktori Lembaga</Link>
            <Link href="/program" className="text-muted-foreground hover:text-foreground">Program Aktif</Link>
            <Link href="/lacak" className="text-muted-foreground hover:text-foreground">Lacak</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-10 space-y-8 max-w-6xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Direktori Lembaga ZISWAF</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Lembaga pengelola Zakat, Infaq, Sedekah, dan Wakaf yang terdaftar &amp; transparan di platform
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Lembaga</p>
            <p className="text-2xl font-bold mt-1">{formatNumber(totalInst)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Terkumpul</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{formatRupiah(totalDonated)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Sudah Tersalur</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(totalDisbursed)}</p>
          </CardContent></Card>
        </div>

        {data.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="size-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Belum ada lembaga terdaftar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((inst) => (
              <Card key={inst.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <Building2 className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight">{inst.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {inst.type && (
                          <Badge variant="outline" className="text-xs">{inst.type.code}</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {LEVEL_LABEL[inst.level] ?? inst.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inst.region && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      <span>{inst.region.name}</span>
                    </div>
                  )}
                  {inst.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="size-3.5" />
                      <span>{inst.phone}</span>
                    </div>
                  )}
                  {inst.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="size-3.5" />
                      <span className="truncate">{inst.email}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Pengumpulan</span>
                      <span className="font-medium text-foreground">{formatRupiah(inst.total_donated)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Penyaluran</span>
                      <span className="font-medium text-emerald-600">{formatRupiah(inst.total_disbursed)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
