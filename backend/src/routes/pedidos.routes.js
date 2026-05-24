import { Router } from "express";
import { crearPedido } from "../controllers/PedidoController.js";
import { obtenerOrdenesAbiertas } from "../controllers/PedidoController.js";
import { editarMontosOrden } from "../controllers/PedidoController.js";
import { eliminarPedido } from "../controllers/PedidoController.js";
const router = Router();

router.post("/pedidos", crearPedido);
router.get("/pedidos/abiertas", obtenerOrdenesAbiertas);
router.put("/editar-montos", editarMontosOrden);
router.delete("/pedidos/:id", eliminarPedido);

export default router;