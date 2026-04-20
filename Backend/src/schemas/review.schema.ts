import { z } from 'zod';

export const createReviewSchema = z.object({
  event_id: z.string().uuid('Event ID harus berupa UUID'),
  booking_id: z.string().uuid('Booking ID harus berupa UUID'),
  rating: z.number().int().min(1, 'Rating minimal 1').max(5, 'Rating maksimal 5'),
  comment: z.string().max(500, 'Komentar maksimal 500 karakter').optional().or(z.literal('')),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating minimal 1').max(5, 'Rating maksimal 5').optional(),
  comment: z.string().max(500, 'Komentar maksimal 500 karakter').optional().or(z.literal('')),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
