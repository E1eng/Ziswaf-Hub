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
  Search,
  Package,
  Calculator,
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
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl">
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-base font-bold">Z</span>
            </div>
            ZISWAF Hub
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-base">
            <Link href="/analitik" className="text-muted-foreground hover:text-foreground transition-colors">
              Data Nasional
            </Link>
            <Link href="/direktori" className="text-muted-foreground hover:text-foreground transition-colors">
              Direktori Lembaga
            </Link>
            <Link href="/lacak" className="text-muted-foreground hover:text-foreground transition-colors">
              Lacak Donasi
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="px-5 py-2.5 text-base font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Coba Demo
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-base font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Daftar Lembaga
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-6 py-28 md:py-40">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <Badge variant="secondary" className="text-base px-5 py-2">
              Platform ZISWAF Pertama di Indonesia
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Salurkan ZISWAF ke{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Penerima yang Tepat</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              ZISWAF Hub membantu lembaga Zakat, Infaq, Sedekah, dan Wakaf
              menentukan kemana dana harus disalurkan — berdasarkan data, transparan, dan tepat sasaran.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                Daftarkan Lembaga Anda
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-emerald-300 bg-emerald-50 text-emerald-700 rounded-xl text-lg font-medium hover:bg-emerald-100 transition-colors"
              >
                Coba Demo Langsung
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-b bg-muted/30">
        <div className="container mx-auto px-6 py-20">
          <p className="text-center text-base font-medium text-muted-foreground mb-10">
            Data ZISWAF Nasional Tahun 2024
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 max-w-5xl mx-auto text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold">{formatRupiah(stats.totalCollection)}</p>
              <p className="text-sm text-muted-foreground mt-2">Pengumpulan 2024</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">{formatRupiah(stats.totalDist)}</p>
              <p className="text-sm text-muted-foreground mt-2">Penyaluran 2024</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">{formatNumber(stats.totalBenef, true)}</p>
              <p className="text-sm text-muted-foreground mt-2">Penerima Manfaat</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">{stats.lembagaCount}</p>
              <p className="text-sm text-muted-foreground mt-2">Lembaga Terdaftar</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-red-600">{formatPct(stats.gapPct)}</p>
              <p className="text-sm text-muted-foreground mt-2">Potensi Belum Tercapai</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Search */}
      <section className="border-t">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package className="size-7 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Lacak Status Donasi Anda</h2>
            <p className="text-lg text-muted-foreground">
              Masukkan kode batch untuk melihat kemana dana Anda telah disalurkan
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <Link
                href="/lacak"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 rounded-xl text-base font-medium hover:bg-muted transition-colors"
              >
                <Search className="size-5" />
                Cari Kode Batch
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Contoh: <code className="bg-muted px-2 py-0.5 rounded">ZH-2024-000001</code>
            </p>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-t">
        <div className="container mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Mengapa ZISWAF Hub?</h2>
            <p className="text-lg text-muted-foreground mt-3">Satu platform untuk seluruh pengelolaan ZISWAF</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center space-y-5 p-8 rounded-2xl border bg-background hover:shadow-lg transition-shadow">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-xl">Smart Targeting Kecamatan</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Analisis 6.455 kecamatan se-Indonesia. Estimasi 8 kategori asnaf per daerah berdasarkan data BPS.
              </p>
            </div>
            <div className="text-center space-y-5 p-8 rounded-2xl border bg-background hover:shadow-lg transition-shadow">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calculator className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-xl">Alokasi Cerdas</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Input anggaran, pilih program — sistem menghitung alokasi optimal ke kecamatan yang paling membutuhkan.
              </p>
            </div>
            <div className="text-center space-y-5 p-8 rounded-2xl border bg-background hover:shadow-lg transition-shadow">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Search className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-xl">Transparan & Terlacak</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Publik bisa melacak penyaluran per batch layaknya lacak paket. Data lembaga terbuka dan bisa dibandingkan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Cara Kerja</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Daftar", desc: "Registrasi lembaga Anda di platform" },
              { step: "2", title: "Catat Data", desc: "Masukkan data pengumpulan & penyaluran" },
              { step: "3", title: "Lihat Rekomendasi", desc: "Sistem merekomendasikan daerah penyaluran" },
              { step: "4", title: "Tingkatkan Dampak", desc: "Salurkan dana ke penerima yang tepat" },
            ].map((item, idx) => (
              <div key={item.step} className="relative text-center space-y-4">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] border-t-2 border-dashed border-muted-foreground/30" />
                )}
                <div className="mx-auto w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-base text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-6 py-28 text-center">
          <div className="max-w-3xl mx-auto p-12 rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border">
            <h2 className="text-3xl md:text-4xl font-bold">
              Siap Mengoptimalkan Penyaluran ZISWAF?
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
              Bergabung dengan lembaga-lembaga yang sudah terdaftar dan dapatkan
              rekomendasi penyaluran yang tepat sasaran.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 mt-8"
            >
              Daftarkan Lembaga Anda
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-base font-semibold">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">Z</span>
              </div>
              ZISWAF Hub
            </div>
            <p className="text-sm text-muted-foreground">
              Platform data ZISWAF nasional. Sumber: BPS, BAZNAS, BWI.
            </p>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/analitik" className="hover:text-foreground">Data Nasional</Link>
              <Link href="/direktori" className="hover:text-foreground">Direktori</Link>
              <Link href="/lacak" className="hover:text-foreground">Lacak Donasi</Link>
              <Link href="/login" className="hover:text-foreground">Masuk</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
