import { Router } from "express";
import { obtenerProductos, agregarStock ,crearProducto} from "../controllers/PoductosController.js";


const router = Router();

router.get("/", obtenerProductos);
router.put("/:id/stock", agregarStock);
router.post("/", crearProducto);

export default router;