import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";
import { createTicketSchema, updateTicketSchema } from "../validators/ticket.validator";

export const ticketController = {
  async getAllByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { event_id, organizer_id } = req.query;
      if (event_id) {
        const tickets = await ticketService.getAllByEvent(event_id as string);
        res.status(200).json({ success: true, data: tickets });
      } else {
        const tickets = await ticketService.getAll(organizer_id as string | undefined);
        res.status(200).json({ success: true, data: tickets });
      }
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        res.status(400).json({ success: false, message: "Validasi gagal", errors: fieldErrors });
        return;
      }
      const ticket = await ticketService.create(parsed.data);
      res.status(201).json({ success: true, message: "Tiket berhasil dibuat", data: ticket });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        res.status(400).json({ success: false, message: "Validasi gagal", errors: fieldErrors });
        return;
      }
      const ticket = await ticketService.update(req.params.id as string, parsed.data);
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
