import { Request, Response, NextFunction } from "express";
import { bookingService } from "../services/booking.service";
import { BookingStatus } from "../../generated/prisma/enums";
import { AuthRequest } from "../middlewares/auth.middleware";

const VALID_STATUSES = Object.values(BookingStatus) as string[];

export const bookingController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { user_id, organizer_id } = req.query;
      const authenticatedUserId = req.user?.id;

      let bookings;
      
      // Determine which user's bookings to fetch
      if (user_id) {
        const userIdString = String(user_id);
        const authenticatedUserIdString = String(authenticatedUserId);
        
        if (userIdString !== authenticatedUserIdString) {
          res.status(403).json({ success: false, message: "Anda tidak memiliki akses ke data user lain" });
          return;
        }
        bookings = await bookingService.getByUser(userIdString);
      } else if (authenticatedUserId) {
        bookings = await bookingService.getByUser(authenticatedUserId);
      } else if (organizer_id) {
        bookings = await bookingService.getAll(organizer_id as string);
      } else {
        res.status(400).json({ success: false, message: "Parameter user_id atau organizer_id diperlukan" });
        return;
      }

      // Check and auto-update expired bookings
      for (const booking of bookings) {
        if (
          booking.status === 'WAITING_FOR_PAYMENTS' &&
          booking.expires_at &&
          new Date(booking.expires_at) < new Date()
        ) {
          await bookingService.updateStatus(booking.id, 'EXPIRED');
        }
      }

      // Re-fetch to get updated statuses
      if (user_id || authenticatedUserId) {
        const finalUserId = user_id ? String(user_id) : String(authenticatedUserId);
        bookings = await bookingService.getByUser(finalUserId);
      } else if (organizer_id) {
        bookings = await bookingService.getAll(organizer_id as string);
      }

      res.status(200).json({ success: true, data: bookings });
    } catch (error) {
      console.error("[BOOKING.GETALL] Error:", error);
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let booking = await bookingService.getById(req.params.id as string);
      if (!booking) {
        res.status(404).json({ success: false, message: "Booking tidak ditemukan" });
        return;
      }

      if (
        booking.status === 'WAITING_FOR_PAYMENTS' &&
        booking.expires_at &&
        new Date(booking.expires_at) < new Date()
      ) {

        await bookingService.updateStatus(req.params.id as string, 'EXPIRED');
        booking = await bookingService.getById(req.params.id as string);
      }

      res.status(200).json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized. Token tidak valid" });
        return;
      }

      const user_id = req.user.id;
      const { event_id, ticket_id, quantity, voucherCode, usePoints, pointsAmount } = req.body;

      // Validasi required fields
      if (!event_id || !ticket_id || !quantity) {
        res.status(400).json({
          success: false,
          message: "event_id, ticket_id, dan quantity wajib diisi",
        });
        return;
      }

      const booking = await bookingService.create({
        user_id,
        event_id,
        ticket_id,
        quantity: Number(quantity),
        voucherCode: voucherCode || undefined,
        usePoints: usePoints || false,
        pointsAmount: pointsAmount ? Number(pointsAmount) : 0,
      });

      res.status(201).json({
        success: true,
        message: "Booking berhasil dibuat",
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Gagal membuat booking",
      });
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!status || !VALID_STATUSES.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Status tidak valid. Pilih: ${VALID_STATUSES.join(", ")}`,
        });
        return;
      }

      const booking = await bookingService.updateStatus(id, status as BookingStatus);
      res.status(200).json({
        success: true,
        message: "Status booking berhasil diupdate",
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await bookingService.softDelete(req.params.id as string);
      res.status(200).json({ success: true, message: "Booking berhasil dihapus" });
    } catch (error) {
      next(error);
    }
  },

  async uploadProof(req: any, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: "File tidak ditemukan",
        });
        return;
      }

      // Get booking to verify user owns it
      const booking = await bookingService.getById(bookingId);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: "Booking tidak ditemukan",
        });
        return;
      }

      if (booking.user_id !== req.user?.id) {
        res.status(403).json({
          success: false,
          message: "Anda tidak memiliki akses ke booking ini",
        });
        return;
      }

      // Call service to handle proof upload and status update
      const updatedBooking = await bookingService.uploadProof(bookingId, file);

      res.status(200).json({
        success: true,
        message: "Bukti pembayaran berhasil diunggah",
        data: updatedBooking,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Gagal upload bukti pembayaran",
      });
    }
  },};