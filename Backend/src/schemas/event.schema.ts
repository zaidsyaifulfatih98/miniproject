import { z } from "zod";

const eventCategories = ["KONSER", "WORKSHOP", "SEMINAR", "FESTIVAL", "OLAHRAGA", "LAINNYA"] as const;
const eventStatuses = ["DRAFT", "PENDING", "ACTIVE", "REJECTED", "COMPLETED", "CANCELLED"] as const;

export const createEventSchema = z.object({
  users_id: z
    .string()
    .min(1, "users_id wajib diisi")
    .uuid("users_id tidak valid"),

  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter")
    .max(100, "Judul maksimal 100 karakter"),

  description: z.string().trim().optional(),

  category: z.enum(eventCategories).default("LAINNYA"),

  location: z.string().trim().optional(),

  price: z
    .number({ error: "Harga harus berupa angka" })
    .min(0, "Harga tidak boleh negatif"),

  total_seats: z
    .number({ error: "Jumlah kursi harus berupa angka" })
    .int("Jumlah kursi harus bilangan bulat")
    .min(1, "Minimal 1 kursi"),

  available_seats: z.number().int().min(0).optional(),

  status: z.enum(eventStatuses).default("DRAFT"),

  start_time: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Format waktu tidak valid")
    .optional(),

  end_time: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Format waktu tidak valid")
    .optional(),

  start_event: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Format tanggal mulai tidak valid")
    .optional(),

  end_event: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Format tanggal selesai tidak valid")
    .optional(),
});

export const updateEventSchema = createEventSchema
  .omit({ users_id: true })
  .partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
