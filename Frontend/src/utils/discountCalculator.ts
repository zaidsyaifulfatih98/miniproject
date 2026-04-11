export interface DiscountInput {
  originalPrice: number;
  discountAmount: number;
  discountType: "percentage" | "fixed";
}

/**
 * Hitung nominal diskon dari harga original dan voucher
 * @param originalPrice Harga asli (dalam Rp)
 * @param discountAmount Nilai diskon (persentase atau nominal)
 * @param discountType Tipe diskon: "percentage" atau "fixed"
 * @returns Nominal diskon yang akan dipotong
 */
export function calculateDiscountAmount(
  originalPrice: number,
  discountAmount: number,
  discountType: "percentage" | "fixed"
): number {
  if (originalPrice <= 0 || discountAmount <= 0) return 0;

  if (discountType === "percentage") {
    // Perhitungan persentase dengan pembulatan ke nearest 100
    const discount = (originalPrice * discountAmount) / 100;
    return Math.round(discount / 100) * 100;
  } else {
    // Fixed amount - tidak melebihi harga original
    return Math.min(Math.round(discountAmount), originalPrice);
  }
}

/**
 * Hitung harga akhir setelah diskon
 * @param originalPrice Harga asli
 * @param discountAmount Nominal diskon
 * @returns Harga akhir
 */
export function calculateFinalPrice(originalPrice: number, discountAmount: number): number {
  return Math.max(0, originalPrice - discountAmount);
}

/**
 * Format harga ke format Rupiah
 * @param amount Jumlah dalam Rp
 * @returns String format "Rp X.XXX"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validasi apakah voucher masih valid
 * @param expiresAt Tanggal expired (ISO string atau null)
 * @param usedCount Jumlah yang sudah digunakan
 * @param maxUsage Kuota maksimal (null = unlimited)
 * @returns Object dengan status valid dan pesan error (jika ada)
 */
export function validateVoucher(
  expiresAt: string | null,
  usedCount: number | null,
  maxUsage: number | null
): { isValid: boolean; error?: string } {
  // Check expiration
  if (expiresAt) {
    const now = new Date();
    const expirationDate = new Date(expiresAt);
    if (now > expirationDate) {
      return { isValid: false, error: "Voucher sudah kadaluarsa" };
    }
  }

  // Check usage quota
  if (maxUsage !== null && usedCount !== null && usedCount >= maxUsage) {
    return { isValid: false, error: "Kuota voucher sudah habis" };
  }

  return { isValid: true };
}

/**
 * Parse discount type dari response API (handle both string dan actual type)
 */
export function parseDiscountType(type: string): "percentage" | "fixed" {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("percent") || lowerType.includes("%")) {
    return "percentage";
  }
  return "fixed";
}
