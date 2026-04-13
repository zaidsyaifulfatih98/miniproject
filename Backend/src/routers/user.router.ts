import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema, loginSchema, updateUserSchema } from "../schemas/user.schema";

const userRouter = Router();

userRouter.post("/login", validate(loginSchema), userController.login);
userRouter.post("/", validate(registerSchema), userController.create);
userRouter.get("/", userController.getAll);
userRouter.get("/:id", userController.getById);
userRouter.put("/:id", validate(updateUserSchema), userController.update);
userRouter.get("/:id/points-history", userController.getPointsHistory);
userRouter.get("/:id/coupons", userController.getMyCoupons);
userRouter.get("/:id/referrals", userController.getReferralHistory);

export default userRouter;