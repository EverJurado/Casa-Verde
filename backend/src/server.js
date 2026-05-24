import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./database/connectionPostgresql.js";
import authRoutes from "./routes/auth.routes.js";
import garzonRoutes from "./routes/garzon.routes.js";
import routerProductos from "./routes/productos.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import reportesRoutes from "./routes/reportes.route.js";
import serviciosExtrasRoutes from "./routes/extras.routes.js";
import personalRoutes from "./routes/personal.routes.js";
import chicasRoutes from "./routes/chicas.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/garzones", garzonRoutes);
app.use("/api/productos", routerProductos);
app.use("/api/servicios-extras", serviciosExtrasRoutes);
app.use("/api/personal", personalRoutes);
app.use("/api", pedidosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/reportes/chicas", chicasRoutes);
app.use("/api/usuarios", usuariosRoutes);

app.listen(PORT, async () => {
  console.log("Servidor corriendo correctamente");
  console.log("Puerto:", PORT);

  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Base de datos conectada correctamente");
    console.log("Hora del servidor PostgreSQL:", res.rows[0].now);
  } catch (error) {
    console.error("Error conectando a PostgreSQL:", error.message);
  }
});
