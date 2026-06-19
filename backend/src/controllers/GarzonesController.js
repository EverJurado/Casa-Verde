import bcrypt from "bcryptjs";
import { pool } from "../database/connectionPostgresql.js";

// crearGarzon legacy — reemplazado por UsuariosController
export const crearGarzon = async (req, res) => {
  res.status(410).json({ message: "Endpoint obsoleto. Usa POST /api/usuarios" });
};

export const crearPersonal = async (req, res) => {
  const { nombre_artistico, celular } = req.body;

  if (!nombre_artistico) {
    return res.status(400).json({ message: "El nombre artístico es obligatorio" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existe = await client.query(
      "SELECT id FROM personal WHERE nombre_artistico = $1",
      [nombre_artistico]
    );

    if (existe.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "El personal ya existe" });
    }

    const result = await client.query(
      `INSERT INTO personal (nombre_artistico, celular, activo)
       VALUES ($1,$2,true) RETURNING *`,
      [nombre_artistico, celular || null]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Personal creado correctamente", personal: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  } finally {
    client.release();
  }
};

export const actualizarPersonal = async (req, res) => {
  const { id } = req.params;
  const { nombre_artistico, celular } = req.body;

  if (!nombre_artistico) {
    return res.status(400).json({ message: "El nombre artístico es obligatorio" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existe = await client.query(
      "SELECT id FROM personal WHERE id = $1",
      [id]
    );

    if (existe.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "El personal no existe" });
    }

    const duplicado = await client.query(
      "SELECT id FROM personal WHERE nombre_artistico = $1 AND id != $2",
      [nombre_artistico, id]
    );

    if (duplicado.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Ya existe otro registro con ese nombre artístico" });
    }

    const result = await client.query(
      `UPDATE personal SET nombre_artistico = $1, celular = $2 WHERE id = $3 RETURNING *`,
      [nombre_artistico, celular || null, id]
    );

    await client.query("COMMIT");
    res.json({ message: "Personal actualizado correctamente", personal: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  } finally {
    client.release();
  }
};

export const getPersonal = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre_artistico, celular
      FROM personal
      WHERE activo = true
      ORDER BY nombre_artistico
    `);
    res.json(result.rows || []);
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
};

export const obtenerGarzones = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        g.id,
        g.nombre,
        g.activo,
        COALESCE(SUM(CASE WHEN DATE(p.fecha) = CURRENT_DATE THEN p.total END), 0) as ventas_dia,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', p.fecha) = DATE_TRUNC('month', CURRENT_DATE) THEN p.total END), 0) as ventas_mes
      FROM usuarios g
      LEFT JOIN pedidos p ON p.garzon_id = g.id
      WHERE g.rol = 'garzon'
      GROUP BY g.id
      ORDER BY g.nombre
    `);

    const data = result.rows.map(g => ({
      ...g,
      comision_dia: g.ventas_dia * 0.07,
      comision_mes: g.ventas_mes * 0.07,
    }));

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo garzones" });
  }
};

export const obtenerReportes = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const [ventasPorDia, ventasPorGarzon, fichasPorPersonal, productosMasVendidos, totales] =
      await Promise.all([
        pool.query(`
          SELECT TO_CHAR(fecha, 'DD/MM') as dia, SUM(total) as ventas
          FROM pedidos
          WHERE fecha >= $1::date
            AND fecha < ($2::date + INTERVAL '1 day')
          GROUP BY dia, DATE(fecha) ORDER BY DATE(fecha)
        `, [startDate, endDate]),

        pool.query(`
          SELECT g.nombre, COALESCE(SUM(p.total),0) as ventas
          FROM usuarios g
          LEFT JOIN pedidos p
            ON g.id = p.garzon_id
           AND p.fecha >= $1::date
           AND p.fecha < ($2::date + INTERVAL '1 day')
          WHERE g.rol = 'garzon'
          GROUP BY g.nombre ORDER BY ventas DESC
        `, [startDate, endDate]),

        pool.query(`
          SELECT c.nombre_artistico as nombre,
                 COALESCE(SUM(CASE WHEN p.id IS NOT NULL THEN pp.monto ELSE 0 END),0) as fichas
          FROM personal c
          LEFT JOIN pedido_personal pp ON pp.personal_id = c.id
          LEFT JOIN pedido_detalle pd ON pp.pedido_detalle_id = pd.id
          LEFT JOIN pedidos p
            ON pd.pedido_id = p.id
           AND p.fecha >= $1::date
           AND p.fecha < ($2::date + INTERVAL '1 day')
          GROUP BY c.nombre_artistico ORDER BY fichas DESC
        `, [startDate, endDate]),

        pool.query(`
          SELECT pd.producto_nombre as nombre,
                 SUM(pd.cantidad * COALESCE(pd.fraccion, 1)) as cantidad_vendida,
                 COALESCE(SUM(pd.subtotal),0) as ventas
          FROM pedido_detalle pd
          JOIN pedidos p ON p.id = pd.pedido_id
          WHERE p.fecha >= $1::date
            AND p.fecha < ($2::date + INTERVAL '1 day')
          GROUP BY pd.producto_nombre ORDER BY cantidad_vendida DESC LIMIT 5
        `, [startDate, endDate]),

        pool.query(`
          SELECT COALESCE(SUM(total),0) as ventas_mes, COUNT(*) as pedidos
          FROM pedidos
          WHERE fecha >= $1::date
            AND fecha < ($2::date + INTERVAL '1 day')
        `, [startDate, endDate]),
      ]);

    res.json({
      ventasPorDia: ventasPorDia.rows,
      ventasPorGarzon: ventasPorGarzon.rows,
      fichasPorPersonal: fichasPorPersonal.rows,
      productosMasVendidos: productosMasVendidos.rows,
      totales: totales.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo reportes" });
  }
};

export const reporteGarzonTurno = async (req, res) => {
  try {
    const { id, rango } = req.params;

    let filtroFecha = "";
    if (rango === "dia") filtroFecha = "DATE(p.fecha) = CURRENT_DATE";
    if (rango === "mes") filtroFecha = "DATE_TRUNC('month', p.fecha) = DATE_TRUNC('month', CURRENT_DATE)";

    const result = await pool.query(`
      SELECT
        COALESCE(SUM(p.total),0) as total_ventas,
        COALESCE(SUM(pp.monto),0) as pago_personal_bebidas,
        COALESCE(SUM(se.monto_personal),0) as pago_personal_servicios
      FROM pedidos p
      LEFT JOIN pedido_detalle pd ON pd.pedido_id = p.id
      LEFT JOIN pedido_personal pp ON pp.pedido_detalle_id = pd.id
      LEFT JOIN servicios_extras se ON se.personal_id = pp.personal_id AND DATE(se.fecha) = DATE(p.fecha)
      WHERE p.garzon_id = $1 AND ${filtroFecha}
    `, [id]);

    const data = result.rows[0];
    const totalVentas = Number(data.total_ventas);
    const comision = totalVentas * 0.07;
    const pagoPersonal = Number(data.pago_personal_bebidas) + Number(data.pago_personal_servicios);

    res.json({ totalVentas, comision, pagoPersonal, totalFinal: totalVentas - comision - pagoPersonal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error reporte garzon turno" });
  }
};

// Aliases para compatibilidad con rutas existentes del frontend
export const crearChica = crearPersonal;
export const actualizarChica = actualizarPersonal;
export const getChicas = getPersonal;
