import prisma from "../configs/pool-coonection.config";
import { BookingStatus } from "../../generated/prisma/enums";

export async function restoreTransactionAssets(
  bookingId: string,
  targetStatus: BookingStatus,
  reason: string = 'Rollback transaction'
) {
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const booking = await tx.bookings.findUnique({
        where: { id: bookingId },
        include: {
          event: true,
          ticket: true,
          promotion: true,
          user: true,
        },
      });

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      if (booking.has_rollback) {
        throw new Error(`Booking ${bookingId} sudah di-rollback sebelumnya`);
      }

      if (booking.quantity && booking.quantity > 0) {
        await tx.events.update({
          where: { id: booking.event_id },
          data: {
            available_seats: {
              increment: booking.quantity,
            },
          },
        });

        await tx.tickets.update({
          where: { id: booking.ticket_id },
          data: {
            used_ticket: {
              decrement: booking.quantity,
            },
          },
        });
      }

      if (booking.points_used && booking.points_used > 0) {
        await tx.users.update({
          where: { id: booking.user_id },
          data: {
            points: {
              increment: booking.points_used,
            },
          },
        });

        await tx.pointsHistory.create({
          data: {
            user_id: booking.user_id,
            points: booking.points_used,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      if (booking.promotion_id) {
        await tx.promotions.update({
          where: { id: booking.promotion_id },
          data: {
            used_count: {
              decrement: 1,
            },
          },
        });
      }
      const updatedBooking = await tx.bookings.update({
        where: { id: bookingId },
        data: {
          status: targetStatus,
          has_rollback: true,
          rollback_reason: reason,
          updatedAt: new Date(),
        },
      });

      return updatedBooking;
    });

    return result;
  } catch (error) {
    console.error(`Rollback failed for booking ${bookingId}:`, error);
    throw error;
  }
}

export async function checkAndExpireBookings() {
  try {
    const now = new Date();

    const expiredBookings = await prisma.bookings.findMany({
      where: {
        status: BookingStatus.WAITING_FOR_PAYMENTS,
        expires_at: {
          lt: now,
        },
        has_rollback: false,
      },
    });

    for (const booking of expiredBookings) {
      try {
        await restoreTransactionAssets(
          booking.id,
          BookingStatus.EXPIRED,
          '2-hour expiration automatic rollback'
        );
      } catch (error) {
        console.error(`Failed to rollback booking ${booking.id}:`, error);
      }
    }

    return {
      success: true,
      expiredCount: expiredBookings.length,
    };
  } catch (error) {
    console.error('Error checking expired bookings:', error);
    throw error;
  }
}

export async function checkAndCancelPendingConfirmations() {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const oldPendingBookings = await prisma.bookings.findMany({
      where: {
        status: BookingStatus.WAITING_FOR_CONFIRMATION,
        createdAt: {
          lt: threeDaysAgo,
        },
        has_rollback: false,
      },
    });

    for (const booking of oldPendingBookings) {
      try {
        await restoreTransactionAssets(
          booking.id,
          BookingStatus.CANCELLED,
          '3-day organizer rule automatic cancellation'
        );
      } catch (error) {
        console.error(`Failed to cancel booking ${booking.id}:`, error);
      }
    }

    return {
      success: true,
      cancelledCount: oldPendingBookings.length,
    };
  } catch (error) {
    console.error('Error checking pending confirmations:', error);
    throw error;
  }
}

export async function approveBooking(bookingId: string) {
  try {
    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.WAITING_FOR_CONFIRMATION) {
      throw new Error(
        `Cannot approve booking with status ${booking.status}. Expected WAITING_FOR_CONFIRMATION`
      );
    }

    const updated = await prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DONE,
        updatedAt: new Date(),
      },
    });

    return updated;
  } catch (error) {
    console.error(`Failed to approve booking ${bookingId}:`, error);
    throw error;
  }
}

export async function rejectBooking(bookingId: string, reason: string = 'Rejected by organizer') {
  try {
    const updated = await restoreTransactionAssets(
      bookingId,
      BookingStatus.REJECTED,
      reason
    );

    return updated;
  } catch (error) {
    console.error(`Failed to reject booking ${bookingId}:`, error);
    throw error;
  }
}
