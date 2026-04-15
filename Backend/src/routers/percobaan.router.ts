import { Router } from "express";
import { percobaanController } from "../controllers/percobaan.controller";

const percobaanRouter = Router()

percobaanRouter.post('/' , percobaanController.register)


export default percobaanRouter