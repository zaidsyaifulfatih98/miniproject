import { Router } from "express";
import { promoController } from "../controllers/promo.controller";

const promoRouter = Router();

promoRouter.get("/", promoController.getAll);
promoRouter.post("/", promoController.create);
promoRouter.put("/:id", promoController.update);
promoRouter.delete("/:id", promoController.delete);

export default promoRouter;
