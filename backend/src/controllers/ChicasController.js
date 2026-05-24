import { pool } from "../database/connectionPostgresql.js";

export const getDetalleChicaPorNombre = async (req, res) => {
  try {
    const { nombre, fecha } = req.params;

    const { rows: botellas } = await pool.query(`
      SELECT
        pd.producto_nombre,
        pd.cantidad,
        pd.fraccion,
        pp.monto,
        (SELECT COUNT(*) FROM pedido_personal pp2 WHERE pp2.pedido_detalle_id = pd.id) as participantes
      FROM pedido_personal pp
      JOIN pedido_detalle pd ON pp.pedido_detalle_id = pd.id
      JOIN pedidos p ON pd.pedido_id = p.id
      WHERE pp.personal_nombre ILIKE $1
      AND DATE(p.fecha) = DATE($2)
      ORDER BY p.fecha
    `, [nombre, fecha]);

    const detalleBotellas = botellas.map((row) => {
      const fraccion = Number(row.fraccion) || 1;
      return {
        concepto:
          fraccion === 0.5
            ? `${row.producto_nombre} (Media)`
            : fraccion > 1
              ? `${row.producto_nombre} (${fraccion})`
              : row.producto_nombre,
        cantidad: fraccion === 0.5 ? "1/2" : Number(row.cantidad) || 1,
        fraccion,
        participantes: Number(row.participantes) || 1,
        monto: Number(row.monto),
        estado: "Activo",
      };
    });

    const { rows: extras } = await pool.query(`
      SELECT s.tipo, s.monto, s.monto_personal
      FROM servicios_extras s
      JOIN personal c ON c.id = s.personal_id
      WHERE LOWER(c.nombre_artistico) = LOWER($1)
      AND s.fecha::date = CURRENT_DATE
      ORDER BY s.fecha
    `, [nombre]);

    const detalleExtras = extras.map(e => ({
      concepto: e.tipo === "propina" ? "Propina" : "Salida",
      cantidad: 1,
      fraccion: 1,
      participantes: 1,
      monto: Number(e.monto_personal),
      estado: "Activo",
    }));

    const detalle = [...detalleBotellas, ...detalleExtras];
    const totalGeneral = detalle.reduce((acc, d) => acc + d.monto, 0);

    res.json({ nombre_artistico: nombre, fecha, detalle, totalGeneral });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno" });
  }
};
