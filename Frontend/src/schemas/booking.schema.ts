import { z } from "zod";

export const createBookingSchema = z.object({
  event_id: z
    .string()
    .min(1, "event_id wajib diisi")
    .uuid("event_id tidak valid"),

  ticket_id: z
    .string()
    .min(1, "ticket_id wajib diisi")
    .uuid("ticket_id tidak valid"),

  promotion_id: z.string().uuid("promotion_id tidak valid").optional(),

  quantity: z
    .number({ error: "Jumlah tiket harus berupa angka" })
    .int("Harus bilangan bulat")
    .min(1, "Minimal 1 tiket")
    .max(10, "Maksimal 10 tiket sekaligus"),

  points_used: z
    .number()
    .int("Poin harus bilangan bulat")
    .min(0, "Poin tidak boleh negatif")
    .optional(),
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
