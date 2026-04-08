import { Router } from "express";
import { bookingController } from "../controllers/booking.controller";

const bookingRouter = Router();

bookingRouter.get("/", bookingController.getAll);
bookingRouter.get("/:id", bookingController.getById);
bookingRouter.post("/", bookingController.create);
bookingRouter.put("/:id/status", bookingController.updateStatus);
bookingRouter.delete("/:id", bookingController.delete);

export default bookingRouter;
