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
import { Shield, Database, Scale } from "lucide-react";

export default function PengaturanPage() {
  return (
    <div className="flex flex-col">
      <PageHeader title="Pengaturan" description="Informasi lembaga dan platform" />

      <main className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Profil Lembaga</CardTitle>
            <CardDescription className="text-sm">
              Informasi lembaga Anda yang terdaftar di ZISWAF Hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base text-muted-foreground">Status</span>
                <Badge variant="secondary" className="text-sm">
                  <Shield className="size-4 mr-1.5" />
                  Terverifikasi
                </Badge>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lembaga Anda terdaftar dan terverifikasi di ZISWAF Hub. Setiap penyaluran tercatat di
                ledger audit yang immutable sesuai standar UU PDP &amp; PP 71/2019.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="size-5" />
              <CardTitle className="text-xl">Sumber Data Domain</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Referensi yang digunakan untuk skoring prioritas dan kategorisasi asnaf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 border rounded-xl">
                <p className="text-base font-semibold">BPS — Badan Pusat Statistik</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Garis kemiskinan, IPM, dan indikator demografi sebagai patokan threshold pendapatan mustahik.
                </p>
              </div>
              <div className="p-4 border rounded-xl">
                <p className="text-base font-semibold">BAZNAS &amp; Puskas BAZNAS</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Standar kategorisasi 8 asnaf, biaya rata-rata per program, &amp; metodologi Indeks Zakat Nasional.
                </p>
              </div>
              <div className="p-4 border rounded-xl">
                <p className="text-base font-semibold">Kemendagri</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Daftar wilayah resmi (provinsi, kabupaten/kota, kecamatan) untuk pemetaan kecamatan_id.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="size-5" />
              <CardTitle className="text-xl">Kepatuhan Regulasi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { law: "UU 23/2011", desc: "Pengelolaan Zakat" },
                { law: "UU 41/2004", desc: "Wakaf" },
                { law: "UU 27/2022", desc: "Perlindungan Data Pribadi (PDP)" },
                { law: "PP 71/2019", desc: "Penyelenggaraan Sistem dan Transaksi Elektronik" },
              ].map((item) => (
                <div key={item.law} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {item.law}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tentang Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
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
                <span className="font-medium">NIK Masked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
