import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";

const ticketRouter = Router();

ticketRouter.get("/", ticketController.getAllByEvent);
ticketRouter.post("/", ticketController.create);
ticketRouter.put("/:id", ticketController.update);
ticketRouter.delete("/:id", ticketController.delete);

export default ticketRouter;
