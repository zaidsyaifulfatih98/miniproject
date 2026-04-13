import { Router } from "express";
import { eventController } from "../controllers/event.controller";
import { validate } from "../middlewares/validate.middleware";
import { createEventSchema, updateEventSchema } from "../schemas/event.schema";

const eventRouter = Router();

eventRouter.get("/", eventController.getAll);
eventRouter.get("/:id", eventController.getById);
eventRouter.post("/", validate(createEventSchema), eventController.create);
eventRouter.put("/:id", validate(updateEventSchema), eventController.update);
eventRouter.delete("/:id", eventController.delete);

export default eventRouter;
