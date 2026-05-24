import bcrypt from "bcryptjs";
import { pool } from "../database/connectionPostgresql.js";

const RX_CELULAR = /^(\+591)?[678]\d{7}$/;

function validarCelular(v) {
  if (!v) return true;
  return RX_CELULAR.test(v.replace(/\s/g, ""));
}

// ===============================
// LISTAR GARZONES
// ===============================
export const listarGarzones = async (req, res) => {
  try {
    const { search = "", page = 1 } = req.query;

    const limit = 10;
    const offset = (Number(page) - 1) * limit;
    const term = `%${search}%`;

    const countRes = await pool.query(
      `SELECT COUNT(*) 
       FROM usuarios
       WHERE rol = 'garzon'
       AND (
         nombre ILIKE $1 OR
         apellido_paterno ILIKE $1 OR
         ci ILIKE $1
       )`,
      [term]
    );

    const dataRes = await pool.query(
      `SELECT 
          id,
          nombre,
          apellido_paterno,
          apellido_materno,
          ci,
          celular,
          celular_referencia,
          activo,
          created_at
       FROM usuarios
       WHERE rol = 'garzon'
       AND (
         nombre ILIKE $1 OR
         apellido_paterno ILIKE $1 OR
        
         ci ILIKE $1
       )
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [term, limit, offset]
    );

    res.json({
      garzones: dataRes.rows,
      total: Number(countRes.rows[0].count),
      page: Number(page),
      totalPages: Math.ceil(Number(countRes.rows[0].count) / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// CREAR GARZON
// ===============================
export const crearGarzon = async (req, res) => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    ci,
    celular,
    celular_referencia,
    activo,
  } = req.body;

  if (!nombre || !apellido_paterno || !ci || !celular) {
    return res.status(400).json({
      error: "Campos obligatorios: nombre, apellido_paterno, ci, celular",
    });
  }

  if (!/^\d+$/.test(ci)) {
    return res.status(400).json({
      error: "El CI debe contener solo números",
    });
  }

  if (!validarCelular(celular)) {
    return res.status(400).json({
      error: "Celular inválido. Use 8 dígitos comenzando con 6, 7 u 8",
    });
  }

  if (celular_referencia && !validarCelular(celular_referencia)) {
    return res.status(400).json({
      error: "Celular de referencia inválido",
    });
  }

  try {
    const ciCheck = await pool.query(
      "SELECT id FROM usuarios WHERE ci = $1",
      [ci]
    );

    if (ciCheck.rows.length > 0) {
      return res.status(400).json({
        error: "El CI ya está registrado",
      });
    }

    const hash = await bcrypt.hash(ci, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (
          nombre,
          apellido_paterno,
          apellido_materno,
          ci,
          password_hash,
          celular,
          celular_referencia,
          rol,
          force_password_change,
          activo
       )
       VALUES (
          $1,$2,$3,$4,$5,$6,$7,'garzon',true,$8
       )
       RETURNING
          id,
          nombre,
          apellido_paterno,
          apellido_materno,
          ci,
          celular,
          activo,
          force_password_change`,
      [
        nombre,
        apellido_paterno,
        apellido_materno || null,
        ci,
        hash,
        celular,
        celular_referencia || null,
        activo !== false,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// ACTUALIZAR GARZON
// ===============================
export const actualizarGarzon = async (req, res) => {
  const { id } = req.params;

  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    ci,
    celular,
    celular_referencia,
    password,
    activo,
  } = req.body;

  if (!nombre || !apellido_paterno || !ci || !celular) {
    return res.status(400).json({
      error: "Campos obligatorios: nombre, apellido_paterno, ci, celular",
    });
  }

  if (!/^\d+$/.test(ci)) {
    return res.status(400).json({
      error: "El CI debe contener solo números",
    });
  }

  if (!validarCelular(celular)) {
    return res.status(400).json({
      error: "Celular inválido. Use 8 dígitos comenzando con 6, 7 u 8",
    });
  }

  if (celular_referencia && !validarCelular(celular_referencia)) {
    return res.status(400).json({
      error: "Celular de referencia inválido",
    });
  }

  try {
    const actual = await pool.query(
      "SELECT * FROM usuarios WHERE id = $1 AND rol = 'garzon'",
      [id]
    );

    if (actual.rows.length === 0) {
      return res.status(404).json({
        error: "Garzón no encontrado",
      });
    }

    const ciCheck = await pool.query(
      "SELECT id FROM usuarios WHERE ci = $1 AND id != $2",
      [ci, id]
    );

    if (ciCheck.rows.length > 0) {
      return res.status(400).json({
        error: "El CI ya está registrado",
      });
    }

    let hash = actual.rows[0].password_hash;
    let forcePasswordChange = actual.rows[0].force_password_change;

    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          error: "La contraseña debe tener al menos 6 caracteres",
        });
      }

      hash = await bcrypt.hash(password, 10);
      forcePasswordChange = false;
    }

    const updated = await pool.query(
      `UPDATE usuarios SET
          nombre = $1,
          apellido_paterno = $2,
          apellido_materno = $3,
          ci = $4,
          celular = $5,
          celular_referencia = $6,
          password_hash = $7,
          force_password_change = $8,
          activo = $9,
          updated_at = NOW()
       WHERE id = $10
       AND rol = 'garzon'
       RETURNING
          id,
          nombre,
          apellido_paterno,
          apellido_materno,
          ci,
          celular,
          activo,
          force_password_change`,
      [
        nombre,
        apellido_paterno,
        apellido_materno || null,
        ci,
        celular,
        celular_referencia || null,
        hash,
        forcePasswordChange,
        activo !== false,
        id,
      ]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// ACTIVAR / DESACTIVAR GARZON
// ===============================
export const toggleActivoGarzon = async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await pool.query(
      `UPDATE usuarios
       SET activo = NOT activo,
           updated_at = NOW()
       WHERE id = $1
       AND rol = 'garzon'
       RETURNING id, nombre, activo`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({
        error: "Garzón no encontrado",
      });
    }

    res.json(updated.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// STATS
// ===============================
export const statsGarzones = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          COUNT(*) FILTER (WHERE activo = true) AS activos,
          COUNT(*) FILTER (WHERE activo = false) AS inactivos
       FROM usuarios
       WHERE rol = 'garzon'`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};