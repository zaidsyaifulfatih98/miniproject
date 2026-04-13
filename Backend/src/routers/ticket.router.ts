import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";
import { validate } from "../middlewares/validate.middleware";
import { createTicketSchema, updateTicketSchema } from "../schemas/ticket.schema";

const ticketRouter = Router();

ticketRouter.get("/", ticketController.getAllByEvent);
ticketRouter.post("/", validate(createTicketSchema), ticketController.create);
ticketRouter.put("/:id", validate(updateTicketSchema), ticketController.update);
ticketRouter.delete("/:id", ticketController.delete);

export default ticketRouter;
