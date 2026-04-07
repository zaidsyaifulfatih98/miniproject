import { Request, Response, NextFunction } from "express";
import { promoService } from "../services/promo.service";

export const promoController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { event_id } = req.query;
      if (event_id) {
        const promos = await promoService.getAllByEvent(event_id as string);
        res.status(200).json({ success: true, data: promos });
      } else {
        const promos = await promoService.getAll();
        res.status(200).json({ success: true, data: promos });
      }
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { event_id, promotion_code, discount_amount, max_usage, expires_at } = req.body;
      if (!event_id || !promotion_code || discount_amount === undefined) {
        res.status(400).json({ success: false, message: "event_id, promotion_code, dan discount_amount wajib diisi" });
        return;
      }
      const promo = await promoService.create({
        event_id,
        promotion_code: promotion_code.toUpperCase(),
        discount_amount: Number(discount_amount),
        max_usage: max_usage ? Number(max_usage) : undefined,
        expires_at,
      });
      res.status(201).json({ success: true, message: "Promo berhasil dibuat", data: promo });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const promo = await promoService.update(id, req.body);
      res.status(200).json({ success: true, message: "Promo berhasil diupdate", data: promo });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await promoService.softDelete(req.params.id as string);
      res.status(200).json({ success: true, message: "Promo berhasil dihapus" });
    } catch (error) {
      next(error);
    }
  },
};
