import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber, formatPct } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";

async function getLandingStats() {
  const supabase = await createClient();
  const year = 2024;

  const [{ data: coll }, { data: dist }, { data: gap }, { data: inst }] = await Promise.all([
    supabase.from("mv_collection_by_region_year").select("total_amount, total_donors").eq("year", year),
    supabase.from("mv_distribution_by_region_year").select("total_amount, total_beneficiaries").eq("year", year),
    supabase.from("mv_gap_analysis").select("estimated_potential, actual_collection").eq("year", year),
    supabase.from("institutions").select("id"),
  ]);

  const totalCollection = (coll || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalDist = (dist || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalBenef = (dist || []).reduce((s, r) => s + (r.total_beneficiaries || 0), 0);
  const totalPotential = (gap || []).reduce((s, r) => s + (r.estimated_potential || 0), 0);
  const totalActual = (gap || []).reduce((s, r) => s + (r.actual_collection || 0), 0);
  const gapPct = totalPotential > 0 ? ((totalPotential - totalActual) / totalPotential) * 100 : 0;
  const lembagaCount = (inst || []).length;

  return { totalCollection, totalDist, totalBenef, gapPct, lembagaCount };
}

export default async function LandingPage() {
  const stats = await getLandingStats();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">Z</span>
            </div>
            ZISWAF Hub
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/analitik" className="text-muted-foreground hover:text-foreground transition-colors">
              Analitik
            </Link>
            <Link href="/direktori" className="text-muted-foreground hover:text-foreground transition-colors">
              Direktori Lembaga
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Daftar Lembaga
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="text-sm px-4 py-1">
              Platform Integrasi ZISWAF Pertama di Indonesia
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Salurkan ZISWAF ke{" "}
              <span className="text-primary">Penerima yang Tepat</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ZISWAF Hub membantu lembaga pengelola Zakat, Infaq, Sedekah, dan Wakaf
              menentukan penyaluran berdasarkan data — transparan, terukur, dan tepat sasaran.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Daftarkan Lembaga Anda
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/analitik"
                className="inline-flex items-center gap-2 px-6 py-3 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Lihat Analitik Nasional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Data ZISWAF Nasional Terintegrasi
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold">{formatRupiah(stats.totalCollection)}</p>
              <p className="text-xs text-muted-foreground mt-1">Pengumpulan 2024</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold">{formatRupiah(stats.totalDist)}</p>
              <p className="text-xs text-muted-foreground mt-1">Penyaluran 2024</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold">{formatNumber(stats.totalBenef, true)}</p>
              <p className="text-xs text-muted-foreground mt-1">Penerima Manfaat</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold">{stats.lembagaCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Lembaga Terintegrasi</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-red-600">{formatPct(stats.gapPct)}</p>
              <p className="text-xs text-muted-foreground mt-1">Gap Potensi Zakat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Mengapa ZISWAF Hub?</h2>
            <p className="text-muted-foreground mt-2">Satu platform untuk seluruh ekosistem ZISWAF</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="size-6 text-primary" />
              </div>
              <h3 className="font-semibold">Targeting Berbasis Data</h3>
              <p className="text-sm text-muted-foreground">
                Rekomendasi daerah & asnaf prioritas penyaluran berdasarkan data kemiskinan BPS
                dan gap penyaluran existing.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="size-6 text-primary" />
              </div>
              <h3 className="font-semibold">Transparansi & Kredibilitas</h3>
              <p className="text-sm text-muted-foreground">
                Lembaga yang terintegrasi mendapat badge verifikasi. Publik bisa melihat
                kinerja dan transparansi data penyaluran.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="size-6 text-primary" />
              </div>
              <h3 className="font-semibold">Benchmark & Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Bandingkan kinerja lembaga Anda dengan agregat nasional. Lihat tren,
                efisiensi, dan area perbaikan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Cara Kerja</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-4 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Daftar", desc: "Registrasi lembaga Anda di platform" },
              { step: "2", title: "Input Data", desc: "Submit data pengumpulan & penyaluran" },
              { step: "3", title: "Dapatkan Insight", desc: "Terima rekomendasi targeting penyaluran" },
              { step: "4", title: "Tingkatkan Dampak", desc: "Salurkan dana ke penerima yang tepat" },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            Siap Mengoptimalkan Penyaluran ZISWAF?
          </h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Bergabung dengan lembaga-lembaga yang sudah terintegrasi dan dapatkan
            rekomendasi penyaluran berbasis data.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors mt-6"
          >
            Daftarkan Lembaga Anda
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="size-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">Z</span>
              </div>
              ZISWAF Hub
            </div>
            <p className="text-xs text-muted-foreground">
              Platform integrasi & analitik ZISWAF nasional. Data BPS, BAZNAS, BWI.
            </p>
            <nav className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/analitik" className="hover:text-foreground">Analitik</Link>
              <Link href="/direktori" className="hover:text-foreground">Direktori</Link>
              <Link href="/login" className="hover:text-foreground">Masuk</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
