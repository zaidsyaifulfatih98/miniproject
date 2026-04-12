import { Request, Response, NextFunction } from "express";
import { promoService } from "../services/promo.service";
import { createPromoSchema, updatePromoSchema } from "../validators/promo.validator";

export const promoController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { event_id, organizer_id } = req.query;
      if (event_id) {
        const promos = await promoService.getAllByEvent(event_id as string);
        res.status(200).json({ success: true, data: promos });
      } else {
        const promos = await promoService.getAll(organizer_id as string | undefined);
        res.status(200).json({ success: true, data: promos });
      }
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createPromoSchema.safeParse(req.body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        res.status(400).json({ success: false, message: "Validasi gagal", errors: fieldErrors });
        return;
      }
      const promo = await promoService.create({
        ...parsed.data,
        promotion_code: parsed.data.promotion_code.toUpperCase(),
      });
      res.status(201).json({ success: true, message: "Promo berhasil dibuat", data: promo });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updatePromoSchema.safeParse(req.body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        res.status(400).json({ success: false, message: "Validasi gagal", errors: fieldErrors });
        return;
      }
      const promo = await promoService.update(req.params.id as string, {
        ...parsed.data,
        promotion_code: parsed.data.promotion_code?.toUpperCase(),
      });
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
