import { Router } from "express";
import { eventController } from "../controllers/event.controller";
import { validate } from "../middlewares/validate.middleware";
import { createEventSchema, updateEventSchema } from "../schemas/event.schema";
import { uploadEventImageMiddleware } from "../middlewares/upload.middleware";

const eventRouter = Router();

eventRouter.get("/", eventController.getAll);
eventRouter.get("/:id", eventController.getById);
eventRouter.get("/:id/stats", eventController.getStats);
eventRouter.post("/", uploadEventImageMiddleware.single('image'), validate(createEventSchema), eventController.create);
eventRouter.post("/:id/track", eventController.trackStat);
eventRouter.post("/:id/upload-image", uploadEventImageMiddleware.single('image'), eventController.uploadImage);
eventRouter.put("/:id", uploadEventImageMiddleware.single('image'), validate(updateEventSchema), eventController.update);
eventRouter.delete("/:id", eventController.delete);

export default eventRouter;
