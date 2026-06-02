import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Target,
  Search,
  Package,
  Calculator,
  ShieldCheck,
} from "lucide-react";

async function getLandingStats() {
  const supabase = await createClient();

  const [{ data: institutions }, { data: batches }, { data: pool }] = await Promise.all([
    supabase.from("institutions").select("id").eq("status", "active"),
    supabase.from("disbursement_batches").select("total_amount, beneficiary_count, status"),
    supabase.from("fund_pool_view").select("total_donated, total_disbursed"),
  ]);

  const institutionCount = (institutions ?? []).length;
  const totalDonated = (pool ?? []).reduce((s, p) => s + Number(p.total_donated ?? 0), 0);
  const totalDisbursed = (batches ?? []).reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const totalBeneficiaries = (batches ?? []).reduce((s, b) => s + (b.beneficiary_count ?? 0), 0);
  const batchCount = (batches ?? []).length;

  return { institutionCount, totalDonated, totalDisbursed, totalBeneficiaries, batchCount };
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
            <Link href="/lembaga" className="text-muted-foreground hover:text-foreground transition-colors">
              Direktori Lembaga
            </Link>
            <Link href="/program" className="text-muted-foreground hover:text-foreground transition-colors">
              Program Aktif
            </Link>
            <Link href="/lacak" className="text-muted-foreground hover:text-foreground transition-colors">
              Lacak Penyaluran
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
              Targeting Mustahik per NIK — Anti Duplikasi
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Salurkan ZISWAF ke{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Penerima yang Tepat
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              ZISWAF Hub membantu lembaga Zakat, Infaq, Sedekah, dan Wakaf memilih mustahik secara
              individual berdasarkan skor prioritas — transparan, terlacak per NIK, anti duplikasi
              lintas-lembaga.
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
            Aktivitas Platform Saat Ini
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-5xl mx-auto text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold">{formatRupiah(stats.totalDonated)}</p>
              <p className="text-sm text-muted-foreground mt-2">Total Donasi Masuk</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">{formatRupiah(stats.totalDisbursed)}</p>
              <p className="text-sm text-muted-foreground mt-2">Total Disalurkan</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">{formatNumber(stats.totalBeneficiaries, true)}</p>
              <p className="text-sm text-muted-foreground mt-2">Penerima Manfaat</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">{stats.institutionCount}</p>
              <p className="text-sm text-muted-foreground mt-2">Lembaga Terdaftar</p>
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
            <h2 className="text-2xl md:text-3xl font-bold">Lacak Status Penyaluran</h2>
            <p className="text-lg text-muted-foreground">
              Masukkan kode batch untuk melihat tahapan penyaluran (data anonim — sesuai UU PDP)
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
              Contoh: <code className="bg-muted px-2 py-0.5 rounded">ZH-2026-000001</code>
            </p>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-t">
        <div className="container mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Mengapa ZISWAF Hub?</h2>
            <p className="text-lg text-muted-foreground mt-3">
              Tiga keunggulan utama untuk lembaga ZISWAF
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center space-y-5 p-8 rounded-2xl border bg-background hover:shadow-lg transition-shadow">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-xl">Targeting per Individu</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Skor prioritas otomatis dari pendapatan, jumlah tanggungan, kategori asnaf, dan kondisi
                tempat tinggal. NIK tervalidasi, anti-duplikasi.
              </p>
            </div>
            <div className="text-center space-y-5 p-8 rounded-2xl border bg-background hover:shadow-lg transition-shadow">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calculator className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-xl">Alokasi Cerdas (Knapsack)</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Masukkan anggaran — sistem memilih mustahik dengan skor tertinggi sampai dana habis.
                Maksimalkan dampak per Rupiah.
              </p>
            </div>
            <div className="text-center space-y-5 p-8 rounded-2xl border bg-background hover:shadow-lg transition-shadow">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-xl">Audit Ledger Immutable</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Setiap pengajuan, persetujuan, dan penyaluran tercatat di ledger yang INSERT-only.
                Tracking publik anonim per batch.
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
              { step: "2", title: "Ajukan Proposal", desc: "Input data mustahik (NIK, asnaf, kondisi)" },
              { step: "3", title: "Alokasi Cerdas", desc: "Sistem pilih penerima dengan knapsack" },
              { step: "4", title: "Salurkan & Lacak", desc: "Update status batch — publik bisa lacak" },
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
              Bergabung dengan lembaga-lembaga yang sudah terdaftar dan dapatkan dukungan keputusan
              berbasis data per individu.
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
              Decision support system untuk ekosistem ZISWAF Indonesia.
            </p>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/lembaga" className="hover:text-foreground">
                Direktori Lembaga
              </Link>
              <Link href="/program" className="hover:text-foreground">
                Program Aktif
              </Link>
              <Link href="/lacak" className="hover:text-foreground">
                Lacak Penyaluran
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Masuk
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
