import express from "express";
import { listarGarzones, crearGarzon, actualizarGarzon, toggleActivoGarzon, statsGarzones } from "../controllers/UsuariosController.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = express.Router();

router.use(adminOnly);

router.get("/", listarGarzones);
router.get("/stats", statsGarzones);
router.post("/", crearGarzon);
router.put("/:id", actualizarGarzon);
router.patch("/:id/toggle", toggleActivoGarzon);

export default router;
