import prisma from "../configs/pool-coonection.config";
import { BookingStatus } from "../../generated/prisma/enums";

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
    promotion_id?: string;
    quantity: number;
    points_used?: number;
  }) {
    const { user_id, event_id, ticket_id, promotion_id, quantity, points_used } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Validasi event
      const event = await tx.events.findUnique({ where: { id: event_id, deletedAt: null } });
      if (!event) throw new Error("Event tidak ditemukan");
      if (event.status !== "ACTIVE") throw new Error("Event tidak dalam status ACTIVE");
      if (event.available_seats < quantity) throw new Error("Kursi tidak tersedia cukup");

      // 2. Validasi ticket
      const ticket = await tx.tickets.findUnique({ where: { id: ticket_id, deletedAt: null } });
      if (!ticket) throw new Error("Tiket tidak ditemukan");
      if (ticket.event_id !== event_id) throw new Error("Tiket tidak milik event ini");
      if (ticket.quota - ticket.used_ticket < quantity) throw new Error("Kuota tiket tidak cukup");

      // 3. Hitung harga
      const total_price = Number(ticket.price) * quantity;
      let discount_amount = 0;
      let finalPromoId: string | undefined = undefined;

      // 4. Validasi dan ambil diskon dari promotion
      if (promotion_id) {
        const promo = await tx.promotions.findUnique({ where: { id: promotion_id, deletedAt: null } });
        if (!promo) throw new Error("Promosi tidak ditemukan");
        if (promo.event_id !== event_id) throw new Error("Promosi tidak berlaku untuk event ini");
        if (promo.expires_at && promo.expires_at < new Date()) throw new Error("Promosi sudah expired");
        if (promo.max_usage !== null && (promo.used_count ?? 0) >= promo.max_usage) {
          throw new Error("Kuota promosi sudah habis");
        }
        discount_amount = Number(promo.discount_amount);
        finalPromoId = promotion_id;

        // Increment used_count promo
        await tx.promotions.update({
          where: { id: promotion_id },
          data: { used_count: { increment: 1 } },
        });
      }

      // 5. Hitung penggunaan poin
      const pointsDeduction = points_used ? points_used : 0;
      const final_price = Math.max(0, total_price - discount_amount - pointsDeduction);

      // 6. Buat booking
      const booking = await tx.bookings.create({
        data: {
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
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
        },
      });

      // 7. Buat payment record kosong
      await tx.payments.create({
        data: {
          booking_id: booking.id,
          amount: final_price,
        },
      });

      // 8. Kurangi available_seats event dan used_ticket tiket
      await tx.events.update({
        where: { id: event_id },
        data: { available_seats: { decrement: quantity } },
      });
      await tx.tickets.update({
        where: { id: ticket_id },
        data: { used_ticket: { increment: quantity } },
      });

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
