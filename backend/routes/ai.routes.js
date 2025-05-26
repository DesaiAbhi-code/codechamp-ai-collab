import { Router } from "express";
import * as aiController from "../controller/Ai.controller.js";

const router = Router();

router.get('/get-result', aiController.generateResult);

export default router;
