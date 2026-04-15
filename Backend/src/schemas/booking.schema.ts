import { z } from "zod";

const bookingStatuses = [
  "PENDING",
  "WAITING_FOR_PAYMENTS",
  "WAITING_FOR_CONFIRMATION",
  "REJECTED",
  "DONE",
  "CANCELLED",
  "EXPIRED",
] as const;

export const createBookingSchema = z.object({
  event_id: z
    .string()
    .min(1, "event_id wajib diisi")
    .uuid("event_id tidak valid"),

  ticket_id: z
    .string()
    .min(1, "ticket_id wajib diisi")
    .uuid("ticket_id tidak valid"),

  quantity: z
    .number({ error: "Jumlah tiket harus berupa angka" })
    .int("Harus bilangan bulat")
    .min(1, "Minimal 1 tiket")
    .max(10, "Maksimal 10 tiket sekaligus"),

  voucherCode: z
    .string()
    .min(1, "Kode voucher tidak boleh kosong")
    .optional(),

  usePoints: z
    .boolean({ error: "usePoints harus boolean" })
    .default(false),

  pointsAmount: z
    .number({ error: "Jumlah poin harus berupa angka" })
    .int("Poin harus bilangan bulat")
    .min(0, "Poin tidak boleh negatif")
    .default(0),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(bookingStatuses, {
    error: `Status harus salah satu dari: ${bookingStatuses.join(", ")}`,
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
