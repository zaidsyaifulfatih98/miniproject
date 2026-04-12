import { z } from "zod";
import { TicketType } from "../../generated/prisma/enums";

export const createTicketSchema = z.object({
  event_id: z.string().min(1, "Event wajib dipilih"),
  type: z.nativeEnum(TicketType, {
    error: "Tipe tiket tidak valid",
  }),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  price: z
    .number({ error: "Harga harus berupa angka" })
    .min(0, "Harga tidak boleh negatif"),
  quota: z
    .number({ error: "Kuota harus berupa angka" })
    .int("Kuota harus bilangan bulat")
    .min(1, "Kuota harus lebih dari 0"),
});

export const updateTicketSchema = z.object({
  type: z
    .nativeEnum(TicketType, {
      error: "Tipe tiket tidak valid",
    })
    .optional(),
  description: z.string().min(1, "Deskripsi wajib diisi").optional(),
  price: z
    .number({ error: "Harga harus berupa angka" })
    .min(0, "Harga tidak boleh negatif")
    .optional(),
  quota: z
    .number({ error: "Kuota harus berupa angka" })
    .int("Kuota harus bilangan bulat")
    .min(1, "Kuota harus lebih dari 0")
    .optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
