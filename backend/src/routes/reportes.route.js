import express from "express";
import {
  getReporteGarzon,
  getReporteChica,
  getChicas,
  reporteJefaTurno,
  reporteChicasTurno,
  resumenChicas,
  getDetalleGarzon,
  reporteProductos,
  reporteVentasPorGarzon,
  reporteVentasPorProducto,
  reporteResumenMensual,
  reporteResumenAnual,
  reporteTurnoFecha,
} from "../controllers/ReportesController.js";

import { getDetalleChicaPorNombre } from "../controllers/ChicasController.js";

const router = express.Router();

// =========================
// GARZON
// =========================
router.get("/garzon/:id/:turno", getReporteGarzon);

// 🔥 CORREGIDO (ANTES TENÍA /reportes/...)
router.get("/garzon-detalle/:id/:turno", getDetalleGarzon);

// =========================
// CHICAS
// =========================
router.get("/chica/:id", getReporteChica);
router.get("/chicas", getChicas);
router.get("/chicas/resumen", resumenChicas);

// por turno
router.get("/chicas/turno/:turno", reporteChicasTurno);

// detalle por nombre + fecha
router.get("/chicas/detalle/nombre/:nombre/:fecha", getDetalleChicaPorNombre);

// =========================
// JEFA
// =========================
router.get("/jefa/:turno", reporteJefaTurno);

// =========================
// PRODUCTOS
// =========================
router.get("/productos", reporteProductos);

// =========================
// NUEVOS REPORTES
// =========================
router.get("/ventas-por-garzon",   reporteVentasPorGarzon);
router.get("/ventas-por-producto", reporteVentasPorProducto);
router.get("/resumen-mensual",     reporteResumenMensual);
router.get("/resumen-anual",       reporteResumenAnual);
router.get("/turno",               reporteTurnoFecha);

export default router;