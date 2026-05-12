/**
 * Format number to Indonesian Rupiah with compact notation.
 * e.g., 40500000000000 → "Rp 40,5 T"
 */
export function formatRupiah(value: number, compact = true): string {
  if (compact) {
    if (value >= 1_000_000_000_000) {
      return `Rp ${(value / 1_000_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} T`;
    }
    if (value >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
    }
    if (value >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
    }
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
}

/**
 * Format number with Indonesian locale.
 * e.g., 1234567 → "1.234.567"
 */
export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Rb`;
    }
  }
  return value.toLocaleString("id-ID");
}

/**
 * Format percentage.
 * e.g., 12.4 → "12,4%"
 */
export function formatPct(value: number, decimals = 1): string {
  return `${value.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}
