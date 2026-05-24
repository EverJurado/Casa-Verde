import express from "express";
import { getDetalleChicaPorNombre } from "../controllers/ChicasController.js";

const router = express.Router();

router.get("/detalle/nombre/:nombre/:fecha", getDetalleChicaPorNombre);

export default router;