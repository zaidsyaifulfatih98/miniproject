import { Router } from "express";
import { bookingController } from "../controllers/booking.controller";
import { validate } from "../middlewares/validate.middleware";
import { createBookingSchema, updateBookingStatusSchema } from "../schemas/booking.schema";
import { authenticateToken, requireCustomerRole } from "../middlewares/auth.middleware";
import { uploadProofMiddleware } from "../middlewares/upload.middleware";

const bookingRouter = Router();

bookingRouter.get("/", authenticateToken, bookingController.getAll);
bookingRouter.get("/:id", bookingController.getById);
bookingRouter.post(
  "/",
  authenticateToken,
  requireCustomerRole,
  validate(createBookingSchema),
  bookingController.create
);
bookingRouter.post(
  "/:id/proof",
  authenticateToken,
  requireCustomerRole,
  uploadProofMiddleware.single("proof"),
  bookingController.uploadProof
);
bookingRouter.put("/:id/status", validate(updateBookingStatusSchema), bookingController.updateStatus);
bookingRouter.delete("/:id", bookingController.delete);

export default bookingRouter;
