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
import { Building2, CheckCircle } from "lucide-react";

async function getDirektoriData() {
  const supabase = await createClient();

  const [{ data: institutions }, { data: types }, { data: collections }] = await Promise.all([
    supabase.from("institutions").select("id, name, institution_type_id, level, region_id, regions(name)").order("name"),
    supabase.from("institution_types").select("id, code, name"),
    supabase.from("collections").select("institution_id, amount, donor_count").eq("year", 2024),
  ]);

  const typeLookup = new Map<string, { code: string; name: string }>();
  for (const t of types || []) typeLookup.set(t.id, { code: t.code, name: t.name });

  const collMap = new Map<string, { amount: number; donors: number }>();
  for (const c of collections || []) {
    const prev = collMap.get(c.institution_id || "") || { amount: 0, donors: 0 };
    collMap.set(c.institution_id || "", {
      amount: prev.amount + (c.amount || 0),
      donors: prev.donors + (c.donor_count || 0),
    });
  }

  const rows = (institutions || []).map((inst) => {
    const typeInfo = typeLookup.get(inst.institution_type_id) || { code: "", name: "" };
    const coll = collMap.get(inst.id) || { amount: 0, donors: 0 };
    return {
      id: inst.id,
      name: inst.name,
      typeName: typeInfo.name,
      typeCode: typeInfo.code,
      level: inst.level,
      region: (inst.regions as { name: string } | null)?.name || "Nasional",
      collection: coll.amount,
      donors: coll.donors,
    };
  }).sort((a, b) => b.collection - a.collection);

  return { rows };
}

export default async function DirektoriPage() {
  const { rows } = await getDirektoriData();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">Z</span>
            </div>
            ZISWAF Hub
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/analitik" className="text-muted-foreground hover:text-foreground">Analitik</Link>
            <Link href="/direktori" className="font-medium">Direktori</Link>
          </nav>
          <Link href="/login" className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-muted">
            Masuk
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Direktori Lembaga</h1>
          <p className="text-muted-foreground mt-1">
            Lembaga pengelola ZISWAF yang terintegrasi dengan ZISWAF Hub
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{rows.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Lembaga Terdaftar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{formatRupiah(rows.reduce((s, r) => s + r.collection, 0))}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Pengumpulan 2024</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{formatNumber(rows.reduce((s, r) => s + r.donors, 0), true)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Donatur</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((inst) => (
            <Card key={inst.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm leading-tight">{inst.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{inst.typeName}</Badge>
                      <CheckCircle className="size-3 text-green-500" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{inst.region}</span>
                  <span className="font-medium text-foreground">{formatRupiah(inst.collection)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
