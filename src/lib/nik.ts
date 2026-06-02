/**
 * NIK validation & masking helpers.
 * Re-exports maskNik dari utils/privacy untuk konsistensi import path.
 */
export { maskNik } from "@/lib/utils/privacy";

const NIK_REGEX = /^\d{16}$/;

export function isValidNik(nik: string): boolean {
  return NIK_REGEX.test(nik.trim());
}
