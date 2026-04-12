import { z } from "zod";
import { PromoType } from "../../generated/prisma/enums";

export const createPromoSchema = z.object({
  event_id: z.string().min(1, "Event wajib dipilih"),
  name: z.string().min(1, "Nama promo wajib diisi"),
  promotion_code: z
    .string()
    .min(1, "Kode kupon wajib diisi")
    .max(50, "Kode kupon maksimal 50 karakter")
    .regex(/^[A-Z0-9_-]+$/i, "Kode kupon hanya boleh berisi huruf, angka, - dan _"),
  type: z
    .nativeEnum(PromoType, {
      error: "Tipe promo tidak valid",
    })
    .optional(),
  discount_amount: z
    .number({ error: "Nominal diskon harus berupa angka" })
    .min(1, "Nominal diskon harus lebih dari 0"),
  max_usage: z
    .number({ error: "Maks. penggunaan harus berupa angka" })
    .int("Maks. penggunaan harus bilangan bulat")
    .min(1, "Maks. penggunaan harus lebih dari 0")
    .optional(),
  expires_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/, "Format tanggal tidak valid")
    .optional(),
});

export const updatePromoSchema = z.object({
  name: z.string().min(1, "Nama promo wajib diisi").optional(),
  promotion_code: z
    .string()
    .min(1, "Kode kupon wajib diisi")
    .max(50, "Kode kupon maksimal 50 karakter")
    .regex(/^[A-Z0-9_-]+$/i, "Kode kupon hanya boleh berisi huruf, angka, - dan _")
    .optional(),
  type: z
    .nativeEnum(PromoType, {
      error: "Tipe promo tidak valid",
    })
    .optional(),
  discount_amount: z
    .number({ error: "Nominal diskon harus berupa angka" })
    .min(1, "Nominal diskon harus lebih dari 0")
    .optional(),
  max_usage: z
    .number({ error: "Maks. penggunaan harus berupa angka" })
    .int("Maks. penggunaan harus bilangan bulat")
    .min(1, "Maks. penggunaan harus lebih dari 0")
    .optional(),
  expires_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/, "Format tanggal tidak valid")
    .optional(),
});

export type CreatePromoInput = z.infer<typeof createPromoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;
