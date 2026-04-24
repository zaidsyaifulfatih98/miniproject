import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema, loginSchema, updateUserSchema } from "../schemas/user.schema";
import { authenticateToken } from "../middlewares/auth.middleware";
import { uploadAvatarMiddleware } from "../middlewares/upload.middleware";

const userRouter = Router();

// Auth routes (no token needed)
userRouter.post("/login", validate(loginSchema), userController.login);
userRouter.post("/logout", userController.logout);
userRouter.post("/forgot-password", userController.forgotPassword);
userRouter.post("/reset-password", userController.resetPassword);

// User CRUD
userRouter.post("/", validate(registerSchema), userController.create);
userRouter.get("/", userController.getAll);
userRouter.get("/:id", userController.getById);
userRouter.put("/:id", validate(updateUserSchema), userController.update);

// Authenticated user-specific routes
userRouter.post("/:id/change-password", authenticateToken, userController.changePassword);
userRouter.post("/:id/avatar", authenticateToken, uploadAvatarMiddleware.single("avatar"), userController.uploadAvatar);
userRouter.get("/:id/points-history", userController.getPointsHistory);
userRouter.get("/:id/coupons", userController.getMyCoupons);
userRouter.get("/:id/referrals", userController.getReferralHistory);

export default userRouter;