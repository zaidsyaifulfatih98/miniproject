import { Router } from "express";
import { promoController } from "../controllers/promo.controller";
import { validate } from "../middlewares/validate.middleware";
import { createPromoSchema, updatePromoSchema, validatePromoSchema } from "../schemas/promo.schema";

const promoRouter = Router();

promoRouter.get("/", promoController.getAll);
promoRouter.post("/", validate(createPromoSchema), promoController.create);
promoRouter.post("/validate", validate(validatePromoSchema), promoController.validate);
promoRouter.put("/:id", validate(updatePromoSchema), promoController.update);
promoRouter.delete("/:id", promoController.delete);

export default promoRouter;
