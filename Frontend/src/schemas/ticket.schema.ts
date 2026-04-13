import { z } from "zod";

const ticketTypes = ["FREE", "EARLY_BIRD", "REGULAR", "VIP", "VVIP"] as const;

export const createTicketSchema = z.object({
  type: z.enum(ticketTypes, {
    error: `Tipe tiket harus salah satu dari: ${ticketTypes.join(", ")}`,
  }),

  description: z
    .string()
    .trim()
    .min(3, "Deskripsi minimal 3 karakter"),

  price: z
    .number({ error: "Harga harus berupa angka" })
    .min(0, "Harga tidak boleh negatif"),

  quota: z
    .number({ error: "Kuota harus berupa angka" })
    .int("Kuota harus bilangan bulat")
    .min(1, "Minimal 1 kuota"),
});

export const updateTicketSchema = createTicketSchema.partial();

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
export type UpdateTicketFormData = z.infer<typeof updateTicketSchema>;
