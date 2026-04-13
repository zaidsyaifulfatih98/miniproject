import { z } from "zod";

const promoTypes = ["FLASH_SALE", "VOUCHER", "BUNDLE", "LAINNYA"] as const;

export const createPromoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter"),

  promotion_code: z
    .string()
    .trim()
    .min(2, "Kode minimal 2 karakter")
    .max(50, "Kode maksimal 50 karakter"),

  type: z.enum(promoTypes).default("VOUCHER"),

  discount_amount: z
    .number({ error: "Besaran diskon harus berupa angka" })
    .min(0, "Diskon tidak boleh negatif"),

  max_usage: z
    .number()
    .int("Harus bilangan bulat")
    .min(1, "Minimal 1 penggunaan")
    .optional(),

  expires_at: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Format tanggal tidak valid")
    .optional(),
});

export const updatePromoSchema = createPromoSchema.partial();

export type CreatePromoFormData = z.infer<typeof createPromoSchema>;
export type UpdatePromoFormData = z.infer<typeof updatePromoSchema>;
