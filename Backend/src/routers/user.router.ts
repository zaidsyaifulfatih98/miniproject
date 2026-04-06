import { Router } from "express";
import { userController } from "../controllers/user.controller";

const userRouter = Router();

userRouter.post("/login/organizer", userController.loginOrganizer);
userRouter.post("/", userController.create);
userRouter.get("/", userController.getAll);
userRouter.get("/:id", userController.getById);
userRouter.put("/:id", userController.update);

export default userRouter;