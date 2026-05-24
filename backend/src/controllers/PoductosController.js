// productos controller
import { pool } from "../database/connectionPostgresql.js";


// obtener productos
export const obtenerProductos = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        precio,
        categoria,
        stock_botellas,
        stock_medias
      FROM productos
      ORDER BY nombre
    `);

    res.json(result.rows || []);

  } catch (error) {
    console.log(error);
    res.status(500).json([]);
  }
};



// vender botella completa
export const venderBotella = async (productoId, client) => {

  const result = await client.query(
    "SELECT * FROM productos WHERE id = $1",
    [productoId]
  );

  const producto = result.rows[0];

  if (producto.stock_botellas <= 0) {
    throw new Error("No hay botellas disponibles");
  }

  await client.query(`
    UPDATE productos
    SET stock_botellas = stock_botellas - 1
    WHERE id = $1
  `, [productoId]);

};




// vender media botella
export const venderMedia = async (productoId, client) => {

  const result = await client.query(
    "SELECT * FROM productos WHERE id = $1",
    [productoId]
  );

  const producto = result.rows[0];

  let botellas = producto.stock_botellas;
  let medias = producto.stock_medias;

  // si hay media usarla
  if (medias > 0) {
    medias -= 1;
  } else {

    // abrir botella
    if (botellas <= 0) {
      throw new Error("No hay stock disponible");
    }

    botellas -= 1;
    medias += 1;
  }

  await client.query(`
    UPDATE productos
    SET stock_botellas = $1,
        stock_medias = $2
    WHERE id = $3
  `, [botellas, medias, productoId]);

};
//aumentar en el invebntario la cantidad de botellas
export const agregarStock = async (req, res) => {
  try {

    const { id } = req.params;
    const { botellas, medias } = req.body;

    await pool.query(`
      UPDATE productos
      SET 
        stock_botellas = stock_botellas + $1,
        stock_medias = stock_medias + $2
      WHERE id = $3
    `, [
      Number(botellas || 0),
      Number(medias || 0),
      id
    ]);

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error agregar stock" });
  }
};
export const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      precio,
      categoria,
      stock_botellas,
      stock_medias
    } = req.body;

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({
        error: "Faltan datos obligatorios"
      });
    }

    const result = await pool.query(`
      INSERT INTO productos (
        nombre,
        precio,
        categoria,
        stock_botellas,
        stock_medias
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [
      nombre,
      precio,
      categoria,
      stock_botellas || 0,
      stock_medias || 0
    ]);

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error creando producto"
    });
  }
};