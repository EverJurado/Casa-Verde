import { pool } from "../database/connectionPostgresql.js";
import { venderMedia, venderBotella } from "./PoductosController.js";

export const crearPedido = async (req, res) => {
  const { garzon_id, total, items } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!garzon_id) throw new Error("Falta el ID del garzón para crear el pedido");

    const garzonRes = await client.query(`SELECT id FROM usuarios WHERE id = $1 AND rol = 'garzon'`, [garzon_id]);
    if (garzonRes.rows.length === 0) throw new Error("El garzón seleccionado no existe");

    const pedido = await client.query(
      `INSERT INTO pedidos (garzon_id, total) VALUES ($1,$2) RETURNING id`,
      [garzon_id, total]
    );
    const pedidoId = pedido.rows[0].id;

    for (const item of items) {
      const productoRes = await client.query(
        `SELECT stock_botellas FROM productos WHERE id = $1`,
        [item.productoId]
      );

      const stockActual = parseFloat(productoRes.rows[0].stock_botellas);
      const cantidadNecesaria = item.fraccion === 0.5 ? item.cantidad * 0.5 : item.cantidad;

      if (stockActual < cantidadNecesaria) {
        throw new Error(`No hay stock suficiente para ${item.productoNombre}`);
      }

      if (item.fraccion === 0.5) {
        await venderMedia(item.productoId, client);
      } else {
        await venderBotella(item.productoId, client);
      }

      const detalleRes = await client.query(
        `INSERT INTO pedido_detalle
          (pedido_id, producto_id, producto_nombre, cantidad, precio, modo, fraccion, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          pedidoId,
          item.productoId,
          item.productoNombre,
          item.cantidad,
          item.precio,
          item.modo || "Bar",
          item.fraccion || 1,
          item.precio * item.cantidad,
        ]
      );
      const detalleId = detalleRes.rows[0].id;

      // Soporte para campo "personal" o "chicas" desde el frontend
      const personalItems = item.personal || item.chicas || [];

      if (personalItems.length > 0) {
        const nombreProd = item.productoNombre.toLowerCase();
        let montoBase = 150;
        if (nombreProd.includes("cerveza") || nombreProd.includes("base") || nombreProd.includes("vaso")) {
          montoBase = 15;
        }

        const montoTotal = montoBase * item.fraccion * item.cantidad;
        const cantidad = personalItems.length;
        const montoPorPersona = montoTotal / cantidad;

        for (const persona of personalItems) {
          await client.query(
            `INSERT INTO pedido_personal (pedido_detalle_id, personal_id, personal_nombre, porcentaje, monto)
             VALUES ($1,$2,$3,$4,$5)`,
            [
              detalleId,
              persona.id,
              persona.nombreArtistico || persona.nombre_artistico,
              100 / cantidad,
              montoPorPersona,
            ]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const obtenerOrdenesAbiertas = async (req, res) => {
  const client = await pool.connect();

  try {
    const { garzon_id } = req.query;

    const pedidosRes = await client.query(
      `SELECT id, fecha FROM pedidos WHERE garzon_id = $1 ORDER BY fecha DESC`,
      [garzon_id]
    );

    const pedidosConDetalles = [];

    for (const pedido of pedidosRes.rows) {
      const detallesRes = await client.query(
        `SELECT id, producto_nombre, subtotal, cantidad, fraccion, precio
         FROM pedido_detalle WHERE pedido_id = $1`,
        [pedido.id]
      );

      const detallesConPersonal = [];

      for (const detalle of detallesRes.rows) {
        const personalRes = await client.query(
          `SELECT pp.personal_id, c.nombre_artistico AS personal_nombre, pp.monto
           FROM pedido_personal pp
           LEFT JOIN personal c ON c.id = pp.personal_id
           WHERE pp.pedido_detalle_id = $1`,
          [detalle.id]
        );

        detallesConPersonal.push({
          id: detalle.id,
          productoNombre: detalle.producto_nombre,
          precio: parseFloat(detalle.precio),
          subtotal: parseFloat(detalle.subtotal),
          cantidad: detalle.cantidad,
          fraccion: parseFloat(detalle.fraccion),
          personal: personalRes.rows.map(p => ({
            personal_id: p.personal_id,
            personal_nombre: p.personal_nombre,
            monto: Number(p.monto),
          })),
        });
      }

      pedidosConDetalles.push({ id: pedido.id, fecha: pedido.fecha, items: detallesConPersonal });
    }

    res.json(pedidosConDetalles);
  } catch (error) {
    console.log(error);
    res.status(500).json([]);
  } finally {
    client.release();
  }
};

export const editarMontosOrden = async (req, res) => {
  const client = await pool.connect();

  try {
    const { orden_id, items } = req.body;
    await client.query("BEGIN");

    for (const item of items) {
      const actualesRes = await client.query(
        `SELECT personal_id FROM pedido_personal WHERE pedido_detalle_id = $1`,
        [item.id]
      );

      const actuales = new Set(actualesRes.rows.map(r => r.personal_id));
      const personalArr = item.personal || item.chicas || [];
      const nuevos = new Set(personalArr.map(c => c.personal_id || c.chica_id || c.id));

      for (const persona of personalArr) {
        const pid = persona.personal_id || persona.chica_id || persona.id;

        const existe = await client.query(
          `SELECT id FROM pedido_personal WHERE pedido_detalle_id = $1 AND personal_id = $2`,
          [item.id, pid]
        );

        if (existe.rows.length > 0) {
          await client.query(
            `UPDATE pedido_personal SET monto = $1 WHERE pedido_detalle_id = $2 AND personal_id = $3`,
            [persona.monto, item.id, pid]
          );
        } else {
          await client.query(
            `INSERT INTO pedido_personal (pedido_detalle_id, personal_id, personal_nombre, porcentaje, monto)
             VALUES ($1,$2,$3,$4,$5)`,
            [item.id, pid, persona.personal_nombre || persona.chica_nombre, persona.porcentaje, persona.monto]
          );
        }
      }

      for (const pid of actuales) {
        if (!nuevos.has(pid)) {
          await client.query(
            `DELETE FROM pedido_personal WHERE pedido_detalle_id = $1 AND personal_id = $2`,
            [item.id, pid]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const eliminarPedido = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    await client.query("BEGIN");
    await client.query(`DELETE FROM pedidos WHERE id = $1`, [id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
