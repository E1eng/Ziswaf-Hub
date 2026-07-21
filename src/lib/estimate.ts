/**
 * Estimasi kebutuhan dana bantuan mustahik (rule-based, deterministik).
 *
 * Pendekatan: berbasis SHORTFALL — selisih antara kebutuhan hidup layak
 * rumah tangga dengan pendapatan bulanan yang ada. Ini jauh lebih akurat
 * daripada rumus lama yang hanya melihat asnaf + tanggungan dan mengabaikan
 * pendapatan (yang bikin estimasi terasa "ngawur").
 *
 * Rumus:
 *   ukuran rumah tangga  = tanggungan + 1 (mustahik sendiri)
 *   kebutuhan bulanan    = garis kemiskinan per kapita × ukuran rumah tangga
 *   shortfall bulanan    = max(0, kebutuhan bulanan − pendapatan)
 *   dasar bantuan        = shortfall × durasi cakupan (bulan)
 *   + penyesuaian rumah  = homeless / rental menambah beban
 *   + faktor asnaf       = pengali kecil sesuai tingkat kerentanan asnaf
 *   dibulatkan & di-clamp antara batas bawah dan batas atas per asnaf
 *
 * Semua angka acuan bisa disetel di ESTIMATE_CONFIG agar mudah dikalibrasi
 * lembaga sesuai wilayah (garis kemiskinan berbeda antar daerah).
 */

export interface EstimateInput {
  asnaf: string;
  monthlyIncome: number;
  dependents: number;
  housing: string; // owned | rental | family | homeless
  /** Penanda kategori khusus (mis. yatim/piatu) — opsional */
  isOrphan?: boolean;
}

export const ESTIMATE_CONFIG = {
  /** Garis kemiskinan per kapita per bulan (acuan BPS nasional ~2024, dibulatkan). */
  povertyLinePerCapita: 600_000,
  /** Berapa bulan kebutuhan yang di-cover satu paket bantuan konsumtif. */
  coverageMonths: 3,
  /** Tambahan beban tempat tinggal per bulan (dikali coverageMonths). */
  housingSurcharge: {
    homeless: 500_000,
    rental: 300_000,
    family: 100_000,
    owned: 0,
  } as Record<string, number>,
  /** Pengali kerentanan per asnaf (tidak mengubah urutan, hanya besaran). */
  asnafMultiplier: {
    fakir: 1.15,
    miskin: 1.0,
    gharimin: 1.0,
    ibnu_sabil: 0.9,
    mualaf: 0.85,
    fisabilillah: 0.85,
    riqab: 1.0,
    amil: 0.6,
  } as Record<string, number>,
  /** Batas bawah & atas nominal bantuan (rupiah). */
  floor: 500_000,
  cap: 10_000_000,
  /** Pembulatan ke kelipatan (biar angka rapi). */
  roundTo: 50_000,
  /** Tambahan kebutuhan khusus anak yatim/piatu (pendidikan & tumbuh kembang). */
  orphanSurchargePerMonth: 400_000,
};

function roundTo(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
}

/**
 * Hitung estimasi kebutuhan dana bantuan (rupiah).
 * Deterministik & dapat diaudit.
 */
export function estimateAssistanceAmount(input: EstimateInput): number {
  const cfg = ESTIMATE_CONFIG;
  const income = Math.max(0, Number(input.monthlyIncome) || 0);
  const deps = Math.max(0, Number(input.dependents) || 0);
  const housing = input.housing || "unknown";

  const householdSize = deps + 1;
  const monthlyNeed = cfg.povertyLinePerCapita * householdSize;
  const monthlyShortfall = Math.max(0, monthlyNeed - income);

  // Dasar: shortfall selama periode cakupan
  let amount = monthlyShortfall * cfg.coverageMonths;

  // Penyesuaian tempat tinggal (beban tetap × periode)
  const housingPerMonth = cfg.housingSurcharge[housing] ?? 0;
  amount += housingPerMonth * cfg.coverageMonths;

  // Tambahan khusus yatim/piatu (kebutuhan pendidikan & tumbuh kembang)
  if (input.isOrphan) {
    amount += cfg.orphanSurchargePerMonth * cfg.coverageMonths;
  }

  // Faktor kerentanan asnaf
  const mult = cfg.asnafMultiplier[input.asnaf] ?? 1.0;
  amount *= mult;

  // Kalau shortfall nol (pendapatan cukup) tetap beri bantuan minimal
  // untuk asnaf sangat rentan; selain itu boleh 0 lalu di-clamp ke floor.
  amount = roundTo(amount, cfg.roundTo);
  amount = Math.max(cfg.floor, Math.min(cfg.cap, amount));

  return amount;
}
