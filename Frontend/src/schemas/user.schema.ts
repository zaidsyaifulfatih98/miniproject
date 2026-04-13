import { z } from "zod";

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(40, "Nama maksimal 40 karakter"),

  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .min(1, "Email wajib diisi"),

  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(72, "Password terlalu panjang"),

  birth_date: z
    .string()
    .min(1, "Tanggal lahir wajib diisi")
    .refine((v) => !isNaN(Date.parse(v)), "Format tanggal tidak valid"),

  gender: z.enum(["Male", "Female"], {
    error: "Jenis kelamin wajib dipilih",
  }),

  address: z
    .string()
    .trim()
    .min(5, "Alamat minimal 5 karakter"),

  role: z.array(z.enum(["CUSTOMERS", "ORGANIZER"])).min(1).default(["CUSTOMERS"]),

  referral_code_used: z
    .string()
    .trim()
    .length(8, "Kode referral harus 8 karakter")
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .min(1, "Email wajib diisi"),

  password: z.string().min(1, "Password wajib diisi"),
});

export const updateUserSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(40).optional(),
  email: z.string().trim().email("Format email tidak valid").optional(),
  birth_date: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Format tanggal tidak valid")
    .optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  address: z.string().trim().min(5, "Alamat minimal 5 karakter").optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
