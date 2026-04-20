import { z } from 'zod';

export const createReviewSchema = z.object({
  event_id: z.string().min(1, 'Event ID diperlukan'),
  booking_id: z.string().min(1, 'Booking ID diperlukan'),
  rating: z.number().min(1, 'Rating minimal 1').max(5, 'Rating maksimal 5'),
  comment: z.string().max(500, 'Komentar maksimal 500 karakter').optional().or(z.literal('')),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
