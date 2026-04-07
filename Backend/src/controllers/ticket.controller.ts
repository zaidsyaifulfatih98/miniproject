import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";
import { TicketType } from "../../generated/prisma/enums";

const VALID_TYPES = Object.values(TicketType) as string[];

export const ticketController = {
  async getAllByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { event_id } = req.query;
      if (event_id) {
        const tickets = await ticketService.getAllByEvent(event_id as string);
        res.status(200).json({ success: true, data: tickets });
      } else {
        const tickets = await ticketService.getAll();
        res.status(200).json({ success: true, data: tickets });
      }
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { event_id, type, description, price, quota } = req.body;
      if (!event_id || !type || !description || price === undefined || !quota) {
        res.status(400).json({ success: false, message: "event_id, type, description, price, dan quota wajib diisi" });
        return;
      }
      if (!VALID_TYPES.includes(type)) {
        res.status(400).json({ success: false, message: `type tidak valid. Pilih: ${VALID_TYPES.join(", ")}` });
        return;
      }
      const ticket = await ticketService.create({
        event_id,
        type: type as TicketType,
        description,
        price: Number(price),
        quota: Number(quota),
      });
      res.status(201).json({ success: true, message: "Tiket berhasil dibuat", data: ticket });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const ticket = await ticketService.update(id, req.body);
      res.status(200).json({ success: true, message: "Tiket berhasil diupdate", data: ticket });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ticketService.softDelete(req.params.id as string);
      res.status(200).json({ success: true, message: "Tiket berhasil dihapus" });
    } catch (error) {
      next(error);
    }
  },
};
