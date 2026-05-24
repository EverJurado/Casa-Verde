import bcrypt from "bcryptjs";
import { pool } from "../database/connectionPostgresql.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE (nombre = $1 OR ci = $1) AND activo = true",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    await pool.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1", [user.id]);

    return res.json({
      success: true,
      user: {
        id: user.id,
        nombre:
          user.nombre +
          " " +
          (user.apellido_paterno || "") +
          " " +
          (user.apellido_materno || ""),
        rol: user.rol === "admin" ? "jefa" : "garzon",
        force_password_change: user.force_password_change,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error del servidor" });
  }
};

export const changePassword = async (req, res) => {
  const { user_id, current_password, new_password } = req.body;

  if (!user_id || !current_password || !new_password) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const result = await pool.query(
      "SELECT password_hash FROM usuarios WHERE id = $1 AND activo = true",
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(
      "UPDATE usuarios SET password_hash = $1, force_password_change = false, updated_at = NOW() WHERE id = $2",
      [hash, user_id]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

export const verifyMasterPassword = async (req, res) => {
  const { admin_id, password } = req.body;

  if (!admin_id || !password) {
    return res.status(400).json({ valid: false, message: "Faltan datos" });
  }

  try {
    const result = await pool.query(
      "SELECT password_hash FROM usuarios WHERE id = $1 AND rol = 'admin' AND activo = true",
      [admin_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, message: "Admin no encontrado" });
    }

    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    return res.json({ valid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ valid: false, message: "Error del servidor" });
  }
};
