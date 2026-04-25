import prisma from '../configs/pool-coonection.config';
import { CreateReviewInput, UpdateReviewInput } from '../schemas/review.schema';

export const reviewService = {
  async createReview(userId: string, data: CreateReviewInput) {
    const { event_id, booking_id, rating, comment } = data;

    return await prisma.$transaction(async (tx) => {
      // Validasi booking
      const booking = await tx.bookings.findUnique({
        where: { id: booking_id },
        include: { event: true },
      });

      if (!booking) throw new Error('Booking tidak ditemukan');
      if (booking.user_id !== userId) throw new Error('Booking bukan milik user ini');
      if (booking.status !== 'DONE') throw new Error('Hanya booking dengan status DONE yang bisa direview');
      
      // Gunakan event_id dari booking (yang sudah terbukti valid)
      const event_id_from_booking = booking.event_id;

      // Validasi event sudah selesai
      const event = await tx.events.findUnique({ where: { id: event_id_from_booking } });
      if (!event) throw new Error('Event tidak ditemukan');

      const now = new Date();
      if (event.end_event && event.end_event > now) {
        throw new Error('Event belum selesai. Hanya event selesai yang bisa direview');
      }

      // Cek duplicate review
      const existingReview = await tx.reviews.findFirst({
        where: { user_id: userId, event_id: event_id_from_booking, deletedAt: null },
      });
      if (existingReview) throw new Error('Anda sudah memberikan review untuk event ini');

      // Create review
      const review = await tx.reviews.create({
        data: {
          user_id: userId,
          event_id: event_id_from_booking,
          booking_id: booking_id,
          rating,
          comment: comment || null,
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return review;
    });
  },

  async getReviewsByEvent(eventId: string) {
    return await prisma.reviews.findMany({
      where: {
        event_id: eventId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getReviewsByUser(userId: string) {
    return await prisma.reviews.findMany({
      where: {
        user_id: userId,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getReviewById(reviewId: string) {
    return await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  },

  async updateReview(reviewId: string, userId: string, data: UpdateReviewInput) {
    const review = await prisma.reviews.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review tidak ditemukan');
    if (review.user_id !== userId) throw new Error('Anda tidak memiliki akses untuk update review ini');

    return await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        rating: data.rating ?? review.rating,
        comment: data.comment !== undefined ? data.comment || null : review.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  },

  async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.reviews.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review tidak ditemukan');
    if (review.user_id !== userId) throw new Error('Anda tidak memiliki akses untuk delete review ini');

    return await prisma.reviews.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });
  },

  async getOrganizerAverageRating(organizerId: string) {
    const result = await prisma.reviews.aggregate({
      where: {
        event: {
          users_id: organizerId,
        },
        deletedAt: null,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      averageRating: result._avg.rating ?? 0,
      totalReviews: result._count.id,
    };
  },

  async getReviewsByOrganizer(organizerId: string, limit: number = 10) {
    return await prisma.reviews.findMany({
      where: {
        event: {
          users_id: organizerId,
        },
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getEventWithReviewStats(eventId: string) {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event tidak ditemukan');
    }

    const reviewStats = await prisma.reviews.aggregate({
      where: {
        event_id: eventId,
        deletedAt: null,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const reviews = await prisma.reviews.findMany({
      where: {
        event_id: eventId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      event,
      stats: {
        averageRating: reviewStats._avg.rating ?? 0,
        totalReviews: reviewStats._count.id,
      },
      reviews,
    };
  },
};

