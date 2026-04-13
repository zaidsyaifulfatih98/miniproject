import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const userController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: "Email dan password wajib diisi" });
        return;
      }

      const result = await userService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json({
        success: true,
        message: "create user successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAll();
      res.status(200).json({
        success: true,
        message: "get all users successfully",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!isUUID(id)) {
        res.status(400).json({ success: false, message: "invalid id" });
        return;
      }

      const user = await userService.getById(id);

      if (!user) {
        res.status(404).json({ success: false, message: "user not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "get user successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!isUUID(id)) {
        res.status(400).json({ success: false, message: "invalid id" });
        return;
      }

      const user = await userService.update(id, req.body);

      res.status(200).json({
        success: true,
        message: "update user successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPointsHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!isUUID(id)) {
        res.status(400).json({ success: false, message: "invalid id" });
        return;
      }
      const [history, available] = await Promise.all([
        userService.getPointsHistory(id),
        userService.getAvailablePoints(id),
      ]);
      res.status(200).json({
        success: true,
        data: { available_points: available, history },
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!isUUID(id)) {
        res.status(400).json({ success: false, message: "invalid id" });
        return;
      }
      const coupons = await userService.getMyCoupons(id);
      res.status(200).json({ success: true, data: coupons });
    } catch (error) {
      next(error);
    }
  },

  async getReferralHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!isUUID(id)) {
        res.status(400).json({ success: false, message: "invalid id" });
        return;
      }
      const referrals = await userService.getReferralHistory(id);
      res.status(200).json({ success: true, data: referrals });
    } catch (error) {
      next(error);
    }
  },
};