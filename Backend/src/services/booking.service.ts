import prisma from "../configs/pool-coonection.config";
import { BookingStatus, PromoType } from "../../generated/prisma/enums";
import { emailService } from "./email.service";

/* Generate unique display_id */
function generateDisplayId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Generate 6 chars alphanumeric
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `INV/${dateStr}/${randomStr}`;
}

/** Deduct `pointsToSpend` */
async function spendPoints(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  user_id: string,
  pointsToSpend: number
): Promise<void> {
  const records = await tx.pointsHistory.findMany({
    where: { user_id, deletedAt: null, expires_at: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
  });

  let remaining = pointsToSpend;
  for (const record of records) {
    if (remaining <= 0) break;

    if (record.points <= remaining) {
      await tx.pointsHistory.update({
        where: { id: record.id },
        data: { deletedAt: new Date() },
      });
      remaining -= record.points;
    } else {
      await tx.pointsHistory.update({
        where: { id: record.id },
        data: { deletedAt: new Date() },
      });
      await tx.pointsHistory.create({
        data: {
          user_id,
          points: record.points - remaining,
          expires_at: record.expires_at,
        },
      });
      remaining = 0;
    }
  }

  // Update users.points balance
  await tx.users.update({
    where: { id: user_id },
    data: { points: { decrement: pointsToSpend } },
  });
}

export const bookingService = {
  async getAll(organizer_id?: string) {
    return await prisma.bookings.findMany({
      where: {
        deletedAt: null,
        ...(organizer_id ? { event: { users_id: organizer_id, deletedAt: null } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, full_name: true, email: true, birth_date: true } },
        event: { select: { id: true, title: true } },
        ticket: { select: { id: true, type: true, price: true } },
        promotion: { select: { id: true, name: true, discount_amount: true } },
        payment: true,
      },
    });
  },

  async getByUser(user_id: string) {
    return await prisma.bookings.findMany({
      where: { user_id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { id: true, title: true, location: true, start_event: true } },
        ticket: { select: { id: true, type: true, price: true } },
        promotion: { select: { id: true, name: true, discount_amount: true } },
        payment: true,
      },
    });
  },

  async getByUserAndEvent(user_id: string, event_id: string) {
    return await prisma.bookings.findMany({
      where: { user_id, event_id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { id: true, title: true, location: true, start_event: true } },
        ticket: { select: { id: true, type: true, price: true } },
        promotion: { select: { id: true, name: true, discount_amount: true } },
        payment: true,
      },
    });
  },

  async getById(id: string) {
    return await prisma.bookings.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, full_name: true, email: true } },
        event: { select: { id: true, title: true, location: true } },
        ticket: { select: { id: true, type: true, price: true } },
        promotion: { select: { id: true, name: true, discount_amount: true } },
        payment: true,
      },
    });
  },

  async create(data: {
    user_id: string;
    event_id: string;
    ticket_id: string;
    quantity: number;
    voucherCode?: string;
    usePoints: boolean;
    pointsAmount: number;
    isFree?: boolean;
  }) {
    const { user_id, event_id, ticket_id, quantity, voucherCode, usePoints, pointsAmount, isFree } = data;

    const createdBooking = await prisma.$transaction(async (tx) => {
      // 1. Validasi event
      const event = await tx.events.findUnique({ 
        where: { id: event_id, deletedAt: null } 
      });
      if (!event) throw new Error("Event tidak ditemukan");
      if (event.status !== "ACTIVE") throw new Error("Event tidak dalam status ACTIVE");
      if (event.available_seats < quantity) throw new Error("Kursi tidak tersedia cukup");

      // 2. Validasi tiket 
      const isDefaultTicket = ticket_id.startsWith("default-");
      let ticket: any;
      let total_price: number;

      if (isDefaultTicket) {
        total_price = Number(event.price) * quantity;
      } else {
        ticket = await tx.tickets.findUnique({ 
          where: { id: ticket_id, deletedAt: null } 
        });
        if (!ticket) throw new Error("Tiket tidak ditemukan");
        if (ticket.event_id !== event_id) throw new Error("Tiket tidak milik event ini");
        if (ticket.quota - ticket.used_ticket < quantity) throw new Error("Kuota tiket tidak cukup");
        total_price = Number(ticket.price) * quantity;
      }

      // 3. Hitung total harga (sudah dikalkulasi di atas)
      let discount_amount = 0;
      let finalPromoId: string | undefined = undefined;

      // 4. Validasi dan ambil diskon dari voucher
      if (voucherCode) {
        const promo = await tx.promotions.findFirst({ 
          where: { promotion_code: voucherCode, deletedAt: null }
        });
        if (!promo) throw new Error("Kode voucher tidak valid");

        if (promo.event_id && promo.event_id !== event_id) {
          throw new Error("Voucher tidak berlaku untuk event ini");
        }

        // Validasi referral coupon
        if (promo.type === PromoType.REFERRAL) {
          if (promo.recipient_user_id !== user_id) {
            throw new Error("Voucher referral ini bukan milik Anda");
          }
        }

        // Cek expired
        if (promo.expires_at && promo.expires_at < new Date()) {
          throw new Error("Voucher sudah expired");
        }

        // Cek max usage
        if (promo.max_usage !== null && promo.used_count >= promo.max_usage) {
          throw new Error("Kuota voucher sudah habis");
        }

        // Hitung discount berdasarkan tipe
        if (promo.type === PromoType.REFERRAL) {
          discount_amount = Math.floor((total_price * Number(promo.discount_amount)) / 100);
        } else {
          discount_amount = Number(promo.discount_amount);
        }

        finalPromoId = promo.id;

        // Increment used_count
        await tx.promotions.update({
          where: { id: promo.id },
          data: { used_count: { increment: 1 } },
        });
      }

      // 5. Validasi dan hitung penggunaan poin
      let pointsDeduction = 0;
      if (usePoints && pointsAmount > 0) {
        const validPointsResult = await tx.pointsHistory.aggregate({
          where: { user_id, deletedAt: null, expires_at: { gt: new Date() } },
          _sum: { points: true },
        });
        const availablePoints = validPointsResult._sum.points ?? 0;
        if (pointsAmount > availablePoints) {
          throw new Error(`Poin tidak cukup. Tersedia: ${availablePoints}, diminta: ${pointsAmount}`);
        }
        pointsDeduction = pointsAmount;
      }

      // 6. Hitung final price
      const final_price = Math.max(0, total_price - discount_amount - pointsDeduction);

      // 7. Generate unique display_id
      const display_id = generateDisplayId();

      // 8. Determine status based on whether it's a free ticket
      const bookingStatus = isFree ? BookingStatus.DONE : BookingStatus.WAITING_FOR_PAYMENTS;
      const expiresAt = isFree ? null : new Date(new Date().getTime() + 2 * 60 * 60 * 1000);

      // 9. Buat booking status
      const booking = await tx.bookings.create({
        data: {
          display_id,
          user_id,
          event_id,
          ticket_id,
          promotion_id: finalPromoId,
          quantity,
          status: bookingStatus,
          total_price,
          discount_amount,
          points_used: pointsDeduction,
          final_price,
          expires_at: expiresAt,
        },
      });

      // 10. Create payment record hanya untuk tiket yang bukan gratis
      if (!isFree) {
        await tx.payments.create({
          data: {
            booking_id: booking.id,
            amount: final_price,
          },
        });
      }

      // 11. Kurangi available_seats event dan tambah used_ticket tiket
      await tx.events.update({
        where: { id: event_id },
        data: { available_seats: { decrement: quantity } },
      });

      // Update used_ticket hanya jika ini bukan default ticket
      if (!isDefaultTicket) {
        await tx.tickets.update({
          where: { id: ticket_id },
          data: { used_ticket: { increment: quantity } },
        });
      }

      // 12. Deduct points dari PointsHistory dan update users.points
      if (pointsDeduction > 0) {
        await spendPoints(tx, user_id, pointsDeduction);
      }

      return booking;
    });

    // 13. Send confirmation email for free tickets (already DONE status)
    if (isFree) {
      const [user, event] = await Promise.all([
        prisma.users.findUnique({ where: { id: user_id }, select: { email: true, full_name: true } }),
        prisma.events.findUnique({ where: { id: event_id }, select: { title: true } }),
      ]);
      if (user && event) {
        emailService.sendApprovalEmail({
          customerEmail: user.email,
          customerName: user.full_name,
          eventTitle: event.title,
          displayId: createdBooking.display_id ?? createdBooking.id.slice(0, 8).toUpperCase(),
          finalPrice: Number(createdBooking.final_price ?? createdBooking.total_price ?? 0),
          quantity: createdBooking.quantity ?? 1,
        }).catch((err) => console.error("Free ticket confirmation email failed:", err));
      }
    }

    return createdBooking;
  },

  async updateStatus(id: string, status: BookingStatus) {
    return await prisma.bookings.update({
      where: { id },
      data: { status },
    });
  },

  async softDelete(id: string) {
    return await prisma.bookings.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async uploadProof(bookingId: string, file: any) {
    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new Error("Booking tidak ditemukan");
    }

    if (booking.status !== "WAITING_FOR_PAYMENTS") {
      throw new Error("Booking tidak dalam status menunggu pembayaran");
    }

    if (!file) {
      throw new Error("File tidak ditemukan");
    }

    // Cloudinary file URL dari multer
    const proofUrl = file.secure_url || file.path;

    const payment = booking.payment;

    if (payment) {
      // Update existing payment
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          payment_proof_url: proofUrl,
          status: "PENDING",
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.payments.create({
        data: {
          booking_id: bookingId,
          payment_proof_url: proofUrl,
          status: "PENDING",
          amount: booking.final_price || booking.total_price,
        },
      });
    }
    
    const updatedBooking = await prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: "WAITING_FOR_CONFIRMATION",
        updatedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        ticket: {
          select: {
            id: true,
            type: true,
            price: true,
          },
        },
        payment: true,
      },
    });

    // Track finalized_views in performance stats
    await prisma.eventPerformanceStats.upsert({
      where: { event_id: booking.event_id },
      create: {
        event_id: booking.event_id,
        detail_views: 0,
        checkout_views: 0,
        finalized_views: 1,
      },
      update: { finalized_views: { increment: 1 } },
    });

    return updatedBooking;
  },

  async approveBooking(bookingId: string, organizerId: string) {
    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.WAITING_FOR_CONFIRMATION) {
      throw new Error(
        `Cannot approve booking with status ${booking.status}. Expected WAITING_FOR_CONFIRMATION`
      );
    }

    if (booking.event.users_id !== organizerId) {
      throw new Error("Organizer does not own this event");
    }

    const updated = await prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DONE,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        ticket: {
          select: {
            id: true,
            type: true,
            price: true,
          },
        },
        payment: true,
      },
    });

    // Send approval email (fire-and-forget)
    emailService.sendApprovalEmail({
      customerEmail: updated.user.email,
      customerName: updated.user.full_name,
      eventTitle: updated.event.title,
      displayId: booking.display_id ?? bookingId.slice(0, 8).toUpperCase(),
      finalPrice: Number(booking.final_price ?? booking.total_price ?? 0),
      quantity: booking.quantity ?? 1,
    }).catch((err) => console.error("Approval email failed:", err));

    return updated;
  },

  async rejectBooking(bookingId: string, reason: string, organizerId: string) {
    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { event: true, promotion: true, user: true },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.WAITING_FOR_CONFIRMATION) {
      throw new Error(
        `Cannot reject booking with status ${booking.status}. Expected WAITING_FOR_CONFIRMATION`
      );
    }

    if (booking.event.users_id !== organizerId) {
      throw new Error("Organizer does not own this event");
    }

    if (booking.has_rollback) {
      throw new Error(`Booking ${bookingId} sudah di-rollback sebelumnya`);
    }

    const updated = await prisma.$transaction(async (tx) => {
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

      return await tx.bookings.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.REJECTED,
          has_rollback: true,
          rollback_reason: reason,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              full_name: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          ticket: {
            select: {
              id: true,
              type: true,
              price: true,
            },
          },
        },
      });
    });

    // Send rejection email (fire-and-forget)
    emailService.sendRejectionEmail({
      customerEmail: updated.user.email,
      customerName: updated.user.full_name,
      eventTitle: updated.event.title,
      displayId: booking.display_id ?? bookingId.slice(0, 8).toUpperCase(),
      finalPrice: Number(booking.final_price ?? booking.total_price ?? 0),
      quantity: booking.quantity ?? 1,
      reason,
    }).catch((err) => console.error("Rejection email failed:", err));

    return updated;
  },

  async getAttendees(event_id: string) {
    return await prisma.bookings.findMany({
      where: {
        event_id,
        status: BookingStatus.DONE,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        display_id: true,
        quantity: true,
        final_price: true,
        total_price: true,
        createdAt: true,
        user: { select: { id: true, full_name: true, email: true } },
        ticket: { select: { id: true, type: true } },
      },
    });
  },
};