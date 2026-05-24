import { Router } from "express";
import { crearPersonal, actualizarPersonal, getPersonal } from "../controllers/GarzonesController.js";

const router = Router();

router.get("/", getPersonal);
router.post("/", crearPersonal);
router.put("/:id", actualizarPersonal);

export default router;
