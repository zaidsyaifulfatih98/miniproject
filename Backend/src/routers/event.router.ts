import { Router } from "express";
import { eventController } from "../controllers/event.controller";

const eventRouter = Router();

eventRouter.get("/", eventController.getAll);
eventRouter.get("/:id", eventController.getById);
eventRouter.post("/", eventController.create);
eventRouter.put("/:id", eventController.update);
eventRouter.delete("/:id", eventController.delete);

export default eventRouter;
