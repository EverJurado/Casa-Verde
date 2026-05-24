import { pool } from "../database/connectionPostgresql.js";

export const getChicas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre_artistico
      FROM personal
      WHERE activo = true
      ORDER BY nombre_artistico
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo personal" });
  }
};

export const getReporteGarzon = async (req, res) => {
  try {
    const { id, turno } = req.params;

    const condicion =
      turno === "dia"
        ? `fecha >= date_trunc('day', now()) + interval '8 hour'
           AND fecha <  date_trunc('day', now()) + interval '20 hour'`
        : `fecha >= date_trunc('day', now()) + interval '20 hour'
           AND fecha <  date_trunc('day', now()) + interval '1 day 8 hour'`;

    const [ventas, personal, servicios] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total),0) as total FROM pedidos WHERE garzon_id = $1 AND ${condicion}`,
        [id]
      ),
      pool.query(
        `SELECT COALESCE(SUM(pp.monto),0) as total
         FROM pedidos p
         JOIN pedido_detalle pd ON pd.pedido_id = p.id
         JOIN pedido_personal pp ON pp.pedido_detalle_id = pd.id
         WHERE p.garzon_id = $1 AND ${condicion.replace(/fecha/g, "p.fecha")}`,
        [id]
      ),
      pool.query(
        `SELECT COALESCE(SUM(monto_personal),0) as total
         FROM servicios_extras WHERE garzon_id = $1 AND ${condicion}`,
        [id]
      ),
    ]);

    const totalVentas = Number(ventas.rows[0].total);
    const bebidasPersonal = Number(personal.rows[0].total);
    const extrasPersonal = Number(servicios.rows[0].total);
    const pagoPersonal = bebidasPersonal + extrasPersonal;
    const comision = totalVentas * 0.07;

    res.json({
      total: totalVentas,
      comision,
      bebidasChicas: bebidasPersonal,
      extrasChicas: extrasPersonal,
      pagoChicas: pagoPersonal,
      totalFinal: totalVentas - comision - pagoPersonal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error reporte garzon" });
  }
};

export const getDetalleGarzon = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        pd.id,
        pd.producto_nombre as producto,
        pd.cantidad,
        pd.fraccion,
        pd.precio,
        p.fecha,
        TO_CHAR(p.fecha, 'HH24:MI') as hora,
        CASE
          WHEN EXTRACT(HOUR FROM p.fecha) >= 20 OR EXTRACT(HOUR FROM p.fecha) < 7 THEN 'noche'
          ELSE 'dia'
        END as turno
      FROM pedidos p
      JOIN pedido_detalle pd ON pd.pedido_id = p.id
      WHERE p.garzon_id = $1
      ORDER BY p.fecha DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error detalle garzon" });
  }
};

export const getReporteChica = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        pd.id,
        pd.producto_nombre as producto,
        pd.cantidad,
        pd.fraccion,
        p.fecha,
        TO_CHAR(p.fecha, 'HH24:MI') as hora,
        CASE
          WHEN EXTRACT(HOUR FROM p.fecha) >= 20 OR EXTRACT(HOUR FROM p.fecha) < 7 THEN 'noche'
          ELSE 'dia'
        END as turno,
        pp.monto as ganancia
      FROM pedido_personal pp
      JOIN pedido_detalle pd ON pp.pedido_detalle_id = pd.id
      JOIN pedidos p ON p.id = pd.pedido_id
      WHERE pp.personal_id = $1
      ORDER BY p.fecha DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error reporte personal" });
  }
};

export const reporteJefaTurno = async (req, res) => {
  try {
    const { turno } = req.params;
    const { date } = req.query;

    const fechaBase = date ? `date_trunc('day', $1::date)` : `date_trunc('day', now())`;
    const condicionTurno =
      turno === "dia"
        ? `${fechaBase} + interval '8 hour' <= p.fecha AND p.fecha < ${fechaBase} + interval '20 hour'`
        : `${fechaBase} + interval '20 hour' <= p.fecha AND p.fecha < ${fechaBase} + interval '1 day 8 hour'`;

    const params = date ? [date] : [];

    const [result, detalleQuery] = await Promise.all([
      pool.query(`
        SELECT
          g.nombre as garzon,
          DATE(p.fecha) as fecha,
          SUM(pd.subtotal) as total_venta,
          COALESCE(SUM(pp.monto), 0) as pago_personal_total
        FROM pedidos p
        JOIN usuarios g ON g.id = p.garzon_id
        JOIN pedido_detalle pd ON pd.pedido_id = p.id
        LEFT JOIN pedido_personal pp ON pp.pedido_detalle_id = pd.id
        WHERE ${condicionTurno}
        GROUP BY g.nombre, DATE(p.fecha)
        ORDER BY fecha DESC
      `, params),

      pool.query(`
        SELECT
          g.nombre as garzon,
          DATE(p.fecha) as fecha,
          pd.producto_nombre as producto,
          pd.cantidad,
          pd.subtotal,
          c.nombre_artistico as chica,
          COALESCE(pp.monto, 0) as pago
        FROM pedidos p
        JOIN usuarios g ON g.id = p.garzon_id
        JOIN pedido_detalle pd ON pd.pedido_id = p.id
        LEFT JOIN pedido_personal pp ON pp.pedido_detalle_id = pd.id
        LEFT JOIN personal c ON c.id = pp.personal_id
        WHERE ${condicionTurno}
        ORDER BY DATE(p.fecha) DESC, g.nombre, pd.producto_nombre
      `, params),
    ]);

    const detalleAgrupado = {};
    detalleQuery.rows.forEach((row) => {
      const key = `${row.garzon}-${row.fecha}-${row.producto}`;
      if (!detalleAgrupado[key]) {
        detalleAgrupado[key] = {
          garzon: row.garzon,
          fecha: row.fecha,
          producto: row.producto,
          cantidad: Number(row.cantidad) || 1,
          chicas: [],
          total: Number(row.subtotal) || 0,
        };
      }
      if (row.chica) {
        detalleAgrupado[key].chicas.push({ nombre: row.chica, pago: Number(row.pago) || 0 });
      }
    });

    const data = result.rows.map((r) => {
      const venta = Number(r.total_venta) || 0;
      const comision = venta * 0.07;
      const pagoPersonalTotal = Number(r.pago_personal_total) || 0;

      const detalles = Object.values(detalleAgrupado).filter(
        (d) =>
          d.garzon === r.garzon &&
          new Date(d.fecha).toDateString() === new Date(r.fecha).toDateString()
      );

      return {
        garzon: r.garzon,
        fecha: r.fecha,
        total_venta: venta,
        comision,
        pagoChicasTotal: pagoPersonalTotal,
        totalFinal: venta - comision - pagoPersonalTotal,
        detalles,
      };
    });

    res.json({
      garzones: data,
      resumen: {
        ventaTotal: data.reduce((a, b) => a + b.total_venta, 0),
        totalComisiones: data.reduce((a, b) => a + b.comision, 0),
        totalChicas: data.reduce((a, b) => a + b.pagoChicasTotal, 0),
        gananciaFinal: data.reduce((a, b) => a + b.totalFinal, 0),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const reporteChicasTurno = async (req, res) => {
  try {
    const { turno } = req.params;
    const condicionPedidos = turno === "dia"
      ? "EXTRACT(HOUR FROM p.fecha) < 19"
      : "EXTRACT(HOUR FROM p.fecha) >= 19";
    const condicionExtras = turno === "dia"
      ? "EXTRACT(HOUR FROM s.fecha) < 19"
      : "EXTRACT(HOUR FROM s.fecha) >= 19";

    const result = await pool.query(`
      SELECT
        fecha, id, nombre_artistico, celular,
        SUM(botellas) as botellas,
        SUM(pago) as pago,
        SUM(salidas) as salidas,
        SUM(monto_salidas) as monto_salidas,
        SUM(monto_propinas) as monto_propinas
      FROM (
        SELECT
          DATE(p.fecha) as fecha,
          c.id, c.nombre_artistico, c.celular,
          COUNT(pp.id) as botellas,
          COALESCE(SUM(pp.monto),0) as pago,
          0 as salidas, 0 as monto_salidas, 0 as monto_propinas
        FROM pedidos p
        JOIN pedido_detalle pd ON pd.pedido_id = p.id
        JOIN pedido_personal pp ON pp.pedido_detalle_id = pd.id
        JOIN personal c ON c.id = pp.personal_id
        WHERE ${condicionPedidos}
        GROUP BY DATE(p.fecha), c.id, c.nombre_artistico, c.celular
        UNION ALL
        SELECT
          DATE(s.fecha) as fecha,
          c.id, c.nombre_artistico, c.celular,
          0 as botellas, 0 as pago,
          COUNT(*) FILTER (WHERE s.tipo='salida') as salidas,
          COALESCE(SUM(s.monto_personal) FILTER (WHERE s.tipo='salida'),0),
          COALESCE(SUM(s.monto_personal) FILTER (WHERE s.tipo='propina'),0)
        FROM servicios_extras s
        JOIN personal c ON c.id = s.personal_id
        WHERE ${condicionExtras}
        GROUP BY DATE(s.fecha), c.id, c.nombre_artistico, c.celular
      ) t
      GROUP BY fecha, id, nombre_artistico, celular
      ORDER BY fecha DESC
    `);

    const agrupado = {};
    result.rows.forEach(r => {
      const fecha = r.fecha;
      if (!agrupado[fecha]) agrupado[fecha] = [];
      agrupado[fecha].push({
        id: r.id,
        nombre: r.nombre_artistico,
        celular: r.celular,
        botellas: Number(r.botellas) || 0,
        pago: Number(r.pago) || 0,
        salidas: Number(r.salidas) || 0,
        monto_salidas: Number(r.monto_salidas) || 0,
        monto_propinas: Number(r.monto_propinas) || 0,
      });
    });

    res.json(agrupado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const resumenChicas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id, c.nombre_artistico, c.celular,
        COUNT(pp.id) as botellas,
        COALESCE(SUM(pp.monto),0) as total
      FROM personal c
      LEFT JOIN pedido_personal pp ON pp.personal_id = c.id
      LEFT JOIN pedido_detalle pd ON pd.id = pp.pedido_detalle_id
      LEFT JOIN pedidos p ON p.id = pd.pedido_id
      WHERE c.activo = true
      GROUP BY c.id, c.nombre_artistico, c.celular
      ORDER BY c.nombre_artistico
    `);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const reporteProductos = async (req, res) => {
  try {
    const { date, turno } = req.query;

    const fechaBase = date ? `date_trunc('day', $1::date)` : `date_trunc('day', now())`;
    const condicionTurno =
      turno === "dia"
        ? `${fechaBase} + interval '8 hour' <= p.fecha AND p.fecha < ${fechaBase} + interval '20 hour'`
        : `${fechaBase} + interval '20 hour' <= p.fecha AND p.fecha < ${fechaBase} + interval '1 day 8 hour'`;

    const params = date ? [date] : [];

    const result = await pool.query(`
      SELECT
        pd.producto_nombre as nombre,
        SUM(pd.cantidad) as cantidad,
        pd.precio as precio_unitario,
        SUM(pd.subtotal) as total
      FROM pedidos p
      JOIN pedido_detalle pd ON pd.pedido_id = p.id
      WHERE ${condicionTurno}
      GROUP BY pd.producto_nombre, pd.precio
      ORDER BY total DESC
    `, params);

    res.json({
      productos: result.rows.map(r => ({
        nombre: r.nombre,
        cantidad: Number(r.cantidad) || 0,
        precio_unitario: Number(r.precio_unitario) || 0,
        total: Number(r.total) || 0,
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// NUEVOS REPORTES
// ─────────────────────────────────────────────

export const reporteVentasPorGarzon = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const fi = fecha_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const ff = fecha_fin   || new Date().toISOString().split('T')[0];

    const result = await pool.query(`
      SELECT
        u.nombre || ' ' || u.apellido_paterno                     AS garzon,
        COUNT(DISTINCT p.id)                                       AS pedidos,
        COALESCE(SUM(p.total), 0)                                  AS total_ventas,
        COALESCE(SUM(p.total) * 0.07, 0)                          AS comision,
        COUNT(DISTINCT se.id)                                      AS servicios_extras,
        MAX(p.fecha)                                               AS ultima_venta
      FROM usuarios u
      LEFT JOIN pedidos p
             ON p.garzon_id = u.id
            AND p.fecha::date BETWEEN $1 AND $2
      LEFT JOIN servicios_extras se
             ON se.garzon_id = u.id
            AND se.fecha::date BETWEEN $1 AND $2
      WHERE u.rol = 'garzon'
      GROUP BY u.id, u.nombre, u.apellido_paterno
      ORDER BY total_ventas DESC
    `, [fi, ff]);

    res.json({ data: result.rows, fecha_inicio: fi, fecha_fin: ff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const reporteVentasPorProducto = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, categoria } = req.query;
    const fi = fecha_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const ff = fecha_fin   || new Date().toISOString().split('T')[0];

    const params = [fi, ff];
    let filtroCategoria = '';
    if (categoria && categoria !== 'Todas') {
      params.push(categoria);
      filtroCategoria = `AND pr.categoria = $${params.length}`;
    }

    const result = await pool.query(`
      SELECT
        COALESCE(pr.nombre, pd.producto_nombre)   AS producto,
        COALESCE(pr.categoria, 'Sin categoría')   AS categoria,
        SUM(pd.cantidad * COALESCE(pd.fraccion,1)) AS cantidad_vendida,
        COALESCE(SUM(pd.subtotal), 0)              AS ingreso_total
      FROM pedido_detalle pd
      JOIN pedidos p ON p.id = pd.pedido_id
      LEFT JOIN productos pr ON pr.id = pd.producto_id
      WHERE p.fecha::date BETWEEN $1 AND $2
      ${filtroCategoria}
      GROUP BY pr.nombre, pd.producto_nombre, pr.categoria
      ORDER BY ingreso_total DESC
    `, params);

    res.json({ data: result.rows, fecha_inicio: fi, fecha_fin: ff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const reporteResumenMensual = async (req, res) => {
  try {
    const anio = req.query.anio || new Date().getFullYear();
    const mes  = req.query.mes  || (new Date().getMonth() + 1);

    const result = await pool.query(`
      WITH dias AS (
        SELECT generate_series(
          DATE_TRUNC('month', MAKE_DATE($1::int, $2::int, 1)),
          DATE_TRUNC('month', MAKE_DATE($1::int, $2::int, 1)) + INTERVAL '1 month' - INTERVAL '1 day',
          INTERVAL '1 day'
        )::date AS dia
      ),
      ventas_dia AS (
        SELECT
          p.fecha::date AS dia,
          SUM(p.total)  AS ventas
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.fecha) = $1
          AND EXTRACT(MONTH FROM p.fecha) = $2
        GROUP BY p.fecha::date
      ),
      top_garzon_dia AS (
        SELECT DISTINCT ON (p.fecha::date)
          p.fecha::date                                   AS dia,
          u.nombre || ' ' || u.apellido_paterno           AS garzon_destacado
        FROM pedidos p
        JOIN usuarios u ON u.id = p.garzon_id
        WHERE EXTRACT(YEAR FROM p.fecha) = $1
          AND EXTRACT(MONTH FROM p.fecha) = $2
        GROUP BY p.fecha::date, u.id, u.nombre, u.apellido_paterno
        ORDER BY p.fecha::date, SUM(p.total) DESC
      )
      SELECT
        d.dia,
        COALESCE(v.ventas, 0)                                      AS ventas_dia,
        SUM(COALESCE(v.ventas, 0)) OVER (ORDER BY d.dia)           AS acumulado,
        COALESCE(g.garzon_destacado, '-')                          AS garzon_destacado
      FROM dias d
      LEFT JOIN ventas_dia v ON v.dia = d.dia
      LEFT JOIN top_garzon_dia g ON g.dia = d.dia
      ORDER BY d.dia
    `, [anio, mes]);

    res.json({ data: result.rows, anio, mes });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const reporteResumenAnual = async (req, res) => {
  try {
    const anio = req.query.anio || new Date().getFullYear();

    const result = await pool.query(`
      WITH meses AS (
        SELECT generate_series(1, 12) AS mes
      ),
      ventas_mes AS (
        SELECT
          EXTRACT(MONTH FROM p.fecha)::int AS mes,
          SUM(p.total)                     AS ventas
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.fecha) = $1
        GROUP BY EXTRACT(MONTH FROM p.fecha)
      ),
      top_garzon_mes AS (
        SELECT DISTINCT ON (EXTRACT(MONTH FROM p.fecha)::int)
          EXTRACT(MONTH FROM p.fecha)::int         AS mes,
          u.nombre || ' ' || u.apellido_paterno    AS garzon_estrella
        FROM pedidos p
        JOIN usuarios u ON u.id = p.garzon_id
        WHERE EXTRACT(YEAR FROM p.fecha) = $1
        GROUP BY EXTRACT(MONTH FROM p.fecha)::int, u.id, u.nombre, u.apellido_paterno
        ORDER BY EXTRACT(MONTH FROM p.fecha)::int, SUM(p.total) DESC
      )
      SELECT
        m.mes,
        TO_CHAR(MAKE_DATE($1::int, m.mes::int, 1), 'TMMonth')  AS mes_nombre,
        COALESCE(v.ventas, 0)                                    AS ventas,
        COALESCE(g.garzon_estrella, '-')                         AS garzon_estrella,
        COALESCE(v.ventas, 0) - COALESCE(
          LAG(COALESCE(v.ventas, 0)) OVER (ORDER BY m.mes), 0
        )                                                        AS crecimiento
      FROM meses m
      LEFT JOIN ventas_mes v      ON v.mes = m.mes
      LEFT JOIN top_garzon_mes g  ON g.mes = m.mes
      ORDER BY m.mes
    `, [anio]);

    res.json({ data: result.rows, anio });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

export const reporteTurnoFecha = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const result = await pool.query(`
      SELECT
        CASE
          WHEN EXTRACT(HOUR FROM p.fecha) >= 8 AND EXTRACT(HOUR FROM p.fecha) < 20
          THEN 'día'
          ELSE 'noche'
        END                                                   AS turno,
        COUNT(DISTINCT p.id)                                  AS pedidos,
        COALESCE(SUM(p.total), 0)                             AS total_ventas,
        COUNT(DISTINCT pd.id)                                 AS productos_vendidos
      FROM pedidos p
      JOIN pedido_detalle pd ON pd.pedido_id = p.id
      WHERE p.fecha::date = $1
        OR (p.fecha::date = ($1::date - INTERVAL '1 day')
            AND EXTRACT(HOUR FROM p.fecha) >= 20)
      GROUP BY turno
      ORDER BY turno
    `, [fecha]);

    res.json({ data: result.rows, fecha });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
