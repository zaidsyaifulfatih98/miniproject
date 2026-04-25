import { Request, Response, NextFunction } from "express";
import { eventService } from "../services/event.service";
import { uploadService } from "../services/upload.service";

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

      const imageUrl = uploadService.getImageUrl(req.file);

      const event = await eventService.create({
        ...req.body,
        available_seats: req.body.available_seats ?? total_seats,
        image_url: imageUrl,
      });
      res.status(201).json({ success: true, message: "Event berhasil dibuat", data: event });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id as string;
      const currentEvent = await eventService.getById(eventId);
      
      if (!currentEvent) {
        res.status(404).json({ success: false, message: "Event tidak ditemukan" });
        return;
      }

      const imageUrl = uploadService.getImageUrl(req.file);
      
      // Delete old image if new image is uploaded
      if (imageUrl && currentEvent.image_url) {
        await uploadService.deleteImage(currentEvent.image_url);
      }

      const event = await eventService.update(eventId, {
        ...req.body,
        ...(imageUrl && { image_url: imageUrl }),
      });
      res.status(200).json({ success: true, message: "Event berhasil diupdate", data: event });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id as string;
      const event = await eventService.getById(eventId);
      
      if (event?.image_url) {
        await uploadService.deleteImage(event.image_url);
      }

      await eventService.softDelete(eventId);
      res.status(200).json({ success: true, message: "Event berhasil dihapus" });
    } catch (error) {
      next(error);
    }
  },

  async trackStat(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { step } = req.body as { step: string };
      if (!["detail", "checkout", "finalized"].includes(step)) {
        res.status(400).json({ success: false, message: "step tidak valid" });
        return;
      }
      const stats = await eventService.trackStat(id, step as "detail" | "checkout" | "finalized");
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const stats = await eventService.getStats(id);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id as string;
      
      if (!req.file) {
        res.status(400).json({ success: false, message: "File tidak ditemukan" });
        return;
      }

      const currentEvent = await eventService.getById(eventId);
      if (!currentEvent) {
        res.status(404).json({ success: false, message: "Event tidak ditemukan" });
        return;
      }

      const imageUrl = uploadService.getImageUrl(req.file);
      
      // Delete old image if exists
      if (currentEvent.image_url) {
        await uploadService.deleteImage(currentEvent.image_url);
      }

      const event = await eventService.update(eventId, {
        image_url: imageUrl,
      });

      res.status(200).json({ success: true, message: "Gambar event berhasil diupload", data: event });
    } catch (error) {
      next(error);
    }
  },
};
