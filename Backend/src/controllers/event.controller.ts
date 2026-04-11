import { Request, Response, NextFunction } from "express";
import { eventService } from "../services/event.service";

export const eventController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        category,
        status,
        search,
        location,
        organizer_id,
        price,
        priceMin,
        priceMax,
        filter,
        type,
        page,
        limit,
        sort,
      } = req.query;

      const result = await eventService.getAll({
        category: category as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
        location: location as string | undefined,
        users_id: organizer_id as string | undefined,
        price: price ? parseInt(price as string) : undefined,
        priceMin: priceMin ? parseInt(priceMin as string) : undefined,
        priceMax: priceMax ? parseInt(priceMax as string) : undefined,
        filter: filter as string | undefined,
        type: type as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 8,
        sort: sort as string | undefined,
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.getById(req.params.id as string);
      if (!event) {
        res.status(404).json({ success: false, message: "Event tidak ditemukan" });
        return;
      }
      res.status(200).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, location, price, total_seats } = req.body;
      if (!title || !price || !total_seats) {
        res.status(400).json({ success: false, message: "title, price, dan total_seats wajib diisi" });
        return;
      }
      const event = await eventService.create({
        ...req.body,
        available_seats: req.body.available_seats ?? total_seats,
      });
      res.status(201).json({ success: true, message: "Event berhasil dibuat", data: event });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.update(req.params.id as string, req.body);
      res.status(200).json({ success: true, message: "Event berhasil diupdate", data: event });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await eventService.softDelete(req.params.id as string);
      res.status(200).json({ success: true, message: "Event berhasil dihapus" });
    } catch (error) {
      next(error);
    }
  },
};
