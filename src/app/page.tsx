import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatNumber } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Target,
  Package,
  Calculator,
  ShieldCheck,
  Sparkles,
  Building2,
  Users,
  Bot,
  CheckCircle2,
  HandCoins,
  TrendingUp,
} from "lucide-react";
import { LandingNav } from "./landing-nav";
import { LandingTracker } from "./landing-tracker";

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
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Decorative blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 size-[400px] sm:size-[600px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-32 size-[400px] sm:size-[600px] rounded-full bg-emerald-200/30 blur-3xl"
        />

        <div className="relative container mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 inline-flex items-center gap-1.5"
            >
              <Sparkles className="size-3 sm:size-3.5" />
              Targeting per NIK · Anti-duplikasi lintas-lembaga
            </Badge>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Salurkan ZISWAF ke{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary/70 bg-clip-text text-transparent">
                Penerima yang Tepat
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Decision support system untuk lembaga Zakat, Infaq, Sedekah, dan Wakaf — pilih
              mustahik secara individual berdasarkan skor prioritas, transparan, terlacak per NIK,
              anti-duplikasi.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-primary text-primary-foreground rounded-xl text-base font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                Daftarkan Lembaga
                <ArrowRight className="size-4 sm:size-5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-emerald-300 bg-emerald-50 text-emerald-700 rounded-xl text-base font-medium hover:bg-emerald-100 transition-colors"
              >
                Coba Demo
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground pt-2">
              <CheckCircle2 className="size-3.5 sm:size-4 text-emerald-500" />
              Gratis untuk lembaga ZISWAF · Tanpa kartu kredit
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats strip */}
      <section className="border-t border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <StatItem
              icon={HandCoins}
              value={formatRupiah(stats.totalDonated)}
              label="Donasi Masuk"
            />
            <StatItem
              icon={TrendingUp}
              value={formatRupiah(stats.totalDisbursed)}
              label="Sudah Tersalur"
            />
            <StatItem
              icon={Users}
              value={formatNumber(stats.totalBeneficiaries, true)}
              label="Penerima Manfaat"
            />
            <StatItem
              icon={Building2}
              value={String(stats.institutionCount)}
              label="Lembaga Aktif"
            />
          </div>
        </div>
      </section>

      {/* Tracking section */}
      <section className="border-b">
        <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl mx-auto text-center space-y-5 sm:space-y-6">
            <div className="mx-auto size-14 sm:size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package className="size-6 sm:size-8 text-primary" />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Lacak Penyaluran Anda
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                Donor & publik bisa lacak status dana secara anonim. Masukkan kode donasi
                <code className="mx-1.5 px-2 py-0.5 bg-muted rounded text-xs">D-...</code>
                atau kode batch
                <code className="mx-1.5 px-2 py-0.5 bg-muted rounded text-xs">ZH-...</code>
              </p>
            </div>
            <LandingTracker />
            <p className="text-xs text-muted-foreground">
              Sesuai UU 27/2022 (PDP) — data sensitif tidak ditampilkan ke publik
            </p>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-24">
          <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
            <Badge variant="outline" className="mb-3">Mengapa ZISWAF Hub</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Tiga keunggulan utama untuk lembaga Anda
            </h2>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <ValueCard
              icon={Target}
              title="Targeting per Individu"
              desc="Skor prioritas otomatis dari pendapatan, jumlah tanggungan, kategori asnaf, dan kondisi tempat tinggal. NIK tervalidasi, anti-duplikasi lintas-lembaga."
              accent="primary"
            />
            <ValueCard
              icon={Calculator}
              title="Alokasi Cerdas Knapsack"
              desc="Masukkan anggaran — sistem memilih mustahik dengan skor tertinggi sampai dana habis. Maksimalkan dampak per Rupiah, multi-fund & fiqih-aware."
              accent="emerald"
            />
            <ValueCard
              icon={ShieldCheck}
              title="Audit Ledger Immutable"
              desc="Setiap pengajuan, persetujuan, dan penyaluran tercatat di ledger INSERT-only. Tracking publik anonim. Penuh kepatuhan UU 23/2011 & UU PDP."
              accent="primary"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-24">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="outline" className="mb-3">Alur Kerja</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Empat langkah dari donor ke mustahik
            </h2>
          </div>
          <div className="grid gap-6 sm:gap-4 md:grid-cols-4 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: Building2,
                title: "Daftarkan Lembaga",
                desc: "Registrasi lembaga ZISWAF — admin, supervisor, reviewer.",
              },
              {
                step: "02",
                icon: Bot,
                title: "Kumpulkan Data",
                desc: "Field worker submit calon mustahik via Telegram bot.",
              },
              {
                step: "03",
                icon: Calculator,
                title: "Alokasi Cerdas",
                desc: "Sistem pilih penerima optimal sesuai program & fiqih.",
              },
              {
                step: "04",
                icon: Package,
                title: "Salurkan & Lacak",
                desc: "Update status batch — donor lacak via kode otomatis.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative bg-card border rounded-2xl p-5 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-xs font-mono font-bold text-primary mb-3">{item.step}</div>
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance strip */}
      <section className="border-t bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Patuh Regulasi Indonesia
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[
                { law: "UU 23/2011", desc: "Pengelolaan Zakat" },
                { law: "UU 41/2004", desc: "Wakaf" },
                { law: "UU 27/2022", desc: "PDP" },
                { law: "PP 71/2019", desc: "PSTE" },
              ].map((item) => (
                <div
                  key={item.law}
                  className="inline-flex items-center gap-2 bg-background border rounded-full px-3 sm:px-4 py-1.5"
                >
                  <Badge variant="secondary" className="text-xs">{item.law}</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-24">
          <div className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-emerald-50 border p-8 sm:p-12 md:p-16 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Siap mengoptimalkan penyaluran ZISWAF Anda?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              Bergabung dengan lembaga yang sudah pakai ZISWAF Hub untuk decision support
              berbasis data per individu.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-primary text-primary-foreground rounded-xl text-base font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                Daftarkan Lembaga
                <ArrowRight className="size-4 sm:size-5" />
              </Link>
              <Link
                href="/lembaga"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 border bg-background rounded-xl text-base font-medium hover:bg-muted transition-colors"
              >
                Lihat Direktori Lembaga
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid gap-6 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 items-start">
            <div className="space-y-2">
              <Link href="/" className="inline-flex items-center gap-2 font-semibold">
                <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">Z</span>
                </div>
                ZISWAF Hub
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                Decision support system untuk ekosistem ZISWAF Indonesia.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-2 text-sm">
              <p className="col-span-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                Platform
              </p>
              <Link href="/lembaga" className="text-muted-foreground hover:text-foreground">
                Direktori Lembaga
              </Link>
              <Link href="/program" className="text-muted-foreground hover:text-foreground">
                Program Aktif
              </Link>
              <Link href="/lacak" className="text-muted-foreground hover:text-foreground">
                Lacak Penyaluran
              </Link>
              <Link href="/demo" className="text-muted-foreground hover:text-foreground">
                Coba Demo
              </Link>
            </nav>

            <nav className="grid grid-cols-2 gap-2 text-sm">
              <p className="col-span-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                Akses Lembaga
              </p>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Masuk
              </Link>
              <Link href="/register" className="text-muted-foreground hover:text-foreground">
                Daftar
              </Link>
            </nav>
          </div>

          <div className="border-t mt-6 sm:mt-8 pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© 2026 ZISWAF Hub. Untuk hackathon Analytic ZISWAF.</p>
            <p>Made with care for ekosistem ZISWAF Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof HandCoins;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <Icon className="size-5 text-primary mx-auto sm:mx-0 mb-2" />
      <p className="text-xl sm:text-2xl md:text-3xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: typeof Target;
  title: string;
  desc: string;
  accent: "primary" | "emerald";
}) {
  const iconBg =
    accent === "emerald" ? "bg-emerald-100" : "bg-primary/10";
  const iconColor =
    accent === "emerald" ? "text-emerald-600" : "text-primary";

  return (
    <div className="bg-card border rounded-2xl p-6 sm:p-7 space-y-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`size-12 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`size-6 ${iconColor}`} />
      </div>
      <h3 className="font-bold text-lg sm:text-xl">{title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
