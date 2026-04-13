import { z } from "zod";

const eventCategories = ["KONSER", "WORKSHOP", "SEMINAR", "FESTIVAL", "OLAHRAGA", "LAINNYA"] as const;
const eventStatuses = ["DRAFT", "PENDING", "ACTIVE", "REJECTED", "COMPLETED", "CANCELLED"] as const;

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter")
    .max(100, "Judul maksimal 100 karakter"),

  description: z.string().trim().optional(),

  category: z.enum(eventCategories, { error: "Pilih kategori yang valid" }).default("LAINNYA"),

  location: z.string().trim().optional(),

  price: z
    .number({ error: "Harga harus berupa angka" })
    .min(0, "Harga tidak boleh negatif"),

  total_seats: z
    .number({ error: "Jumlah kursi harus berupa angka" })
    .int("Harus bilangan bulat")
    .min(1, "Minimal 1 kursi"),

  status: z.enum(eventStatuses).default("DRAFT"),

  start_event: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Tanggal mulai tidak valid")
    .optional(),

  end_event: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Tanggal selesai tidak valid")
    .optional(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type UpdateEventFormData = z.infer<typeof updateEventSchema>;
