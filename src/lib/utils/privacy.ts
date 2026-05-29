/**
 * NIK masking utility — UU PDP compliance
 * NIK (16 digit) ditampilkan sebagai "3201****0001" di semua UI
 * Raw NIK hanya digunakan untuk validasi duplikat di backend
 */
export function maskNik(nik: string): string {
  if (!nik || nik.length < 8) return "****";
  return nik.slice(0, 4) + "****" + nik.slice(-4);
}
