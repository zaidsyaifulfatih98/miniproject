import { z } from "zod";
import { EventCategory, EventStatus } from "../../generated/prisma/enums";

const dateTimeString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
    "Format tanggal/waktu tidak valid (gunakan format YYYY-MM-DDTHH:MM)"
  )
  .optional();

export const createEventSchema = z
  .object({
    users_id: z.string().min(1, "users_id wajib diisi"),
    title: z.string().min(1, "Nama event wajib diisi"),
    location: z.string().min(1, "Lokasi wajib diisi"),
    description: z.string().min(1, "Deskripsi wajib diisi"),
    category: z
      .nativeEnum(EventCategory, {
        error: "Kategori tidak valid",
      })
      .optional(),
    status: z
      .nativeEnum(EventStatus, {
        error: "Status tidak valid",
      })
      .optional(),
    price: z
      .number({ error: "Harga harus berupa angka" })
      .min(0, "Harga tidak boleh negatif"),
    total_seats: z
      .number({ error: "Kapasitas harus berupa angka" })
      .int("Kapasitas harus bilangan bulat")
      .min(1, "Kapasitas venue harus lebih dari 0"),
    available_seats: z.number().int().min(0).optional(),
    start_event: dateTimeString,
    end_event: dateTimeString,
  })
  .refine(
    (data) => {
      if (data.start_event && data.end_event) {
        return new Date(data.end_event) >= new Date(data.start_event);
      }
      return true;
    },
    {
      message: "Tanggal berakhir tidak boleh sebelum tanggal mulai",
      path: ["end_event"],
    }
  );

export const updateEventSchema = z
  .object({
    title: z.string().min(1, "Nama event wajib diisi").optional(),
    location: z.string().min(1, "Lokasi wajib diisi").optional(),
    description: z.string().min(1, "Deskripsi wajib diisi").optional(),
    category: z
      .nativeEnum(EventCategory, {
        error: "Kategori tidak valid",
      })
      .optional(),
    status: z
      .nativeEnum(EventStatus, {
        error: "Status tidak valid",
      })
      .optional(),
    price: z
      .number({ error: "Harga harus berupa angka" })
      .min(0, "Harga tidak boleh negatif")
      .optional(),
    total_seats: z
      .number({ error: "Kapasitas harus berupa angka" })
      .int("Kapasitas harus bilangan bulat")
      .min(1, "Kapasitas venue harus lebih dari 0")
      .optional(),
    available_seats: z.number().int().min(0).optional(),
    start_event: dateTimeString,
    end_event: dateTimeString,
  })
  .refine(
    (data) => {
      if (data.start_event && data.end_event) {
        return new Date(data.end_event) >= new Date(data.start_event);
      }
      return true;
    },
    {
      message: "Tanggal berakhir tidak boleh sebelum tanggal mulai",
      path: ["end_event"],
    }
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
