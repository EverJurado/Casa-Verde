import express from "express";

import {
  crearServicioExtra,
  obtenerServiciosActivos,
  obtenerServicios,
  actualizarServicioExtra,
  eliminarServicioExtra,
} from "../controllers/ExtrasController.js";

const router = express.Router();

router.post("/", crearServicioExtra);
router.put("/:id", actualizarServicioExtra);
router.delete("/:id", eliminarServicioExtra);

router.get("/", obtenerServicios);

router.get("/activos", obtenerServiciosActivos);

export default router;