import { pool } from "../database/connectionPostgresql.js";

const asegurarColumnasServiciosExtras = async () => {
  await pool.query(`
    ALTER TABLE servicios_extras
      ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS hora_fin TIMESTAMP
  `);

  await pool.query(`
    UPDATE servicios_extras
    SET hora_fin = CASE
      WHEN tipo = 'propina' THEN fecha
      ELSE fecha + (COALESCE(duracion_minutos, 0) * INTERVAL '1 minute')
    END
    WHERE hora_fin IS NULL
  `);
};

export const crearServicioExtra = async (req, res) => {
  try {
    await asegurarColumnasServiciosExtras();

    const { chica_id, personal_id, monto, tipo, duracion_minutos, garzon_id } = req.body;
    const pid = personal_id || chica_id;
    const montoNumerico = Number(monto);

    if (!pid) {
      return res.status(400).json({ error: "Seleccione el personal" });
    }

    if (!tipo || Number.isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({ error: "Datos del servicio inválidos" });
    }

    const porcentaje = tipo === "propina" ? 100 : 60;
    const monto_personal = (montoNumerico * porcentaje) / 100;

    const ahora = new Date();
    const duracionReal = tipo === "propina" ? 0 : Number(duracion_minutos);
    const hora_fin = tipo === "propina" ? ahora : new Date(ahora.getTime() + duracionReal * 60000);

    const result = await pool.query(
      `INSERT INTO servicios_extras
        (personal_id, tipo, monto, porcentaje_personal, monto_personal, duracion_minutos, hora_fin, garzon_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [pid, tipo, montoNumerico, porcentaje, monto_personal, duracionReal, hora_fin, garzon_id || null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando servicio" });
  }
};

export const obtenerServiciosActivos = async (req, res) => {
  try {
    await asegurarColumnasServiciosExtras();

    const result = await pool.query(`
      SELECT s.*,
             c.nombre_artistico,
             s.fecha as fecha_local,
             COALESCE(s.hora_fin, s.fecha) as hora_fin_local
      FROM servicios_extras s
      JOIN personal c ON c.id = s.personal_id
      WHERE COALESCE(s.hora_fin, s.fecha) > NOW()
      ORDER BY s.fecha DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo servicios activos" });
  }
};

export const actualizarServicioExtra = async (req, res) => {
  try {
    await asegurarColumnasServiciosExtras();

    const { id } = req.params;
    const { chica_id, personal_id, monto, tipo, duracion_minutos, garzon_id } = req.body;
    const pid = personal_id || chica_id;
    const montoNumerico = Number(monto);

    if (!pid) {
      return res.status(400).json({ error: "Seleccione el personal" });
    }

    if (!tipo || Number.isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({ error: "Datos del servicio inválidos" });
    }

    const servicioRes = await pool.query(
      `SELECT fecha FROM servicios_extras WHERE id = $1`,
      [id]
    );

    if (servicioRes.rows.length === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const porcentaje = tipo === "propina" ? 100 : 60;
    const monto_personal = (montoNumerico * porcentaje) / 100;
    const fecha = new Date(servicioRes.rows[0].fecha);
    const hora_fin =
      tipo === "propina"
        ? fecha
        : new Date(fecha.getTime() + Number(duracion_minutos) * 60000);

    const result = await pool.query(
      `UPDATE servicios_extras
       SET personal_id=$1, tipo=$2, monto=$3, porcentaje_personal=$4,
           monto_personal=$5, duracion_minutos=$6, hora_fin=$7, garzon_id=$8
      WHERE id=$9
       RETURNING *`,
      [pid, tipo, montoNumerico, porcentaje, monto_personal, duracion_minutos, hora_fin, garzon_id || null, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando servicio" });
  }
};

export const eliminarServicioExtra = async (req, res) => {
  try {
    await asegurarColumnasServiciosExtras();

    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM servicios_extras WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando servicio" });
  }
};

export const obtenerServicios = async (req, res) => {
  try {
    await asegurarColumnasServiciosExtras();

    const result = await pool.query(`
      SELECT s.*,
             c.nombre_artistico,
             s.fecha as fecha_local,
             COALESCE(s.hora_fin, s.fecha) as hora_fin_local
      FROM servicios_extras s
      JOIN personal c ON c.id = s.personal_id
      ORDER BY s.fecha DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo servicios" });
  }
};
