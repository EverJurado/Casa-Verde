import { Router } from "express";
import { crearGarzon } from "../controllers/GarzonesController.js";
import { crearChica } from "../controllers/GarzonesController.js";
import { actualizarChica } from "../controllers/GarzonesController.js";
import { obtenerProductos } from "../controllers/PoductosController.js";
import { getChicas } from "../controllers/GarzonesController.js";
import { obtenerGarzones } from "../controllers/GarzonesController.js";
import { obtenerReportes } from "../controllers/GarzonesController.js";
import { reporteGarzonTurno } from "../controllers/GarzonesController.js";

const router = Router();

router.post("/crear", crearGarzon);
router.post("/chicas", crearChica);
router.put("/chicas/:id", actualizarChica);
router.get("/productos", obtenerProductos);
router.get("/", getChicas);
router.get("/lista", obtenerGarzones);
router.get("/reportes", obtenerReportes);
router.get("/garzon-turno/:id/:rango",reporteGarzonTurno);



export default router;