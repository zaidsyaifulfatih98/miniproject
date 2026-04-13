import prisma from "../configs/pool-coonection.config";
import { BookingStatus, PromoType } from "../../generated/prisma/enums";

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
        user: { select: { id: true, full_name: true, email: true } },
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
  }) {
    const { user_id, event_id, ticket_id, quantity, voucherCode, usePoints, pointsAmount } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Validasi event
      const event = await tx.events.findUnique({ 
        where: { id: event_id, deletedAt: null } 
      });
      if (!event) throw new Error("Event tidak ditemukan");
      if (event.status !== "ACTIVE") throw new Error("Event tidak dalam status ACTIVE");
      if (event.available_seats < quantity) throw new Error("Kursi tidak tersedia cukup");

      // 2. Validasi tiket
      const ticket = await tx.tickets.findUnique({ 
        where: { id: ticket_id, deletedAt: null } 
      });
      if (!ticket) throw new Error("Tiket tidak ditemukan");
      if (ticket.event_id !== event_id) throw new Error("Tiket tidak milik event ini");
      if (ticket.quota - ticket.used_ticket < quantity) throw new Error("Kuota tiket tidak cukup");

      // 3. Hitung total harga
      const total_price = Number(ticket.price) * quantity;
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

      // 8. Buat booking dengan status WAITING_FOR_PAYMENTS
      const booking = await tx.bookings.create({
        data: {
          display_id,
          user_id,
          event_id,
          ticket_id,
          promotion_id: finalPromoId,
          quantity,
          status: BookingStatus.WAITING_FOR_PAYMENTS,
          total_price,
          discount_amount,
          points_used: pointsDeduction,
          final_price,
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 jam
        },
      });

      // 9. Buat payment record kosong
      await tx.payments.create({
        data: {
          booking_id: booking.id,
          amount: final_price,
        },
      });

      // 10. Kurangi available_seats event dan tambah used_ticket tiket
      await tx.events.update({
        where: { id: event_id },
        data: { available_seats: { decrement: quantity } },
      });
      await tx.tickets.update({
        where: { id: ticket_id },
        data: { used_ticket: { increment: quantity } },
      });

      // 11. Deduct points dari PointsHistory dan update users.points
      if (pointsDeduction > 0) {
        await spendPoints(tx, user_id, pointsDeduction);
      }

      return booking;
    });
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
};
