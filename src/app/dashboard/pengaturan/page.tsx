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
      <PageHeader
        title="Pengaturan"
        description="Informasi akun lembaga dan platform"
      />

      <main className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil Lembaga</CardTitle>
            <CardDescription>Informasi lembaga Anda yang ditampilkan di direktori publik</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary" className="text-xs">
                  <Shield className="size-3 mr-1" />
                  Terintegrasi
                </Badge>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Lembaga Anda terdaftar dan terverifikasi di ZISWAF Hub. Data yang Anda submit
                akan ditampilkan di profil publik dan berkontribusi pada analitik nasional.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="size-4" />
              <CardTitle>Sumber Data Platform</CardTitle>
            </div>
            <CardDescription>Data yang digunakan untuk targeting & benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">BPS — Badan Pusat Statistik</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Kemiskinan, IPM, PDRB, populasi per provinsi (2019-2024).
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">BAZNAS / SIMBA</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Statistik pengumpulan & penyaluran ZIS-DSKL nasional.
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">BWI / SIWAK</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Data aset wakaf nasional: lokasi, sertifikasi, produktivitas.
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Lembaga Terintegrasi</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Data yang di-submit oleh lembaga-lembaga yang terdaftar di ZISWAF Hub.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="size-4" />
              <CardTitle>Kepatuhan Regulasi</CardTitle>
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
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap">{item.law}</Badge>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tentang Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versi</span>
                <span className="font-medium">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">2019-2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provinsi</span>
                <span className="font-medium">34</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stack</span>
                <span className="font-medium">Next.js + Supabase</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
