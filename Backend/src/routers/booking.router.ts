import { Router } from "express";
import { bookingController } from "../controllers/booking.controller";
import { validate } from "../middlewares/validate.middleware";
import { createBookingSchema, updateBookingStatusSchema } from "../schemas/booking.schema";
import { authenticateToken, requireCustomerRole, requireOrganizerRole } from "../middlewares/auth.middleware";
import { uploadProofMiddleware } from "../middlewares/upload.middleware";

const bookingRouter = Router();

bookingRouter.get("/", authenticateToken, bookingController.getAll);
bookingRouter.get(
  "/attendees",
  authenticateToken,
  requireOrganizerRole,
  bookingController.getAttendees
);
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
bookingRouter.post(
  "/:bookingId/approve",
  authenticateToken,
  requireOrganizerRole,
  bookingController.approveBooking
);
bookingRouter.post(
  "/:bookingId/reject",
  authenticateToken,
  requireOrganizerRole,
  bookingController.rejectBooking
);
bookingRouter.delete("/:id", bookingController.delete);

export default bookingRouter;
