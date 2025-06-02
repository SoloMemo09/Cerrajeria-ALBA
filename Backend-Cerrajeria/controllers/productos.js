const db = require('../config/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM productos', (error, resultados) => {
    if (error) {
      res.status(500).json({ error: 'Error al obtener productos' });
    } else {
      res.json(resultados);
    }
  });
};

// Ejemplo de cómo añadir un producto (POST)
exports.create = (req, res) => {
  const { nombre, descripcion, precio, cantidad_stock, id_categoria } = req.body;
  db.query(
    'INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, id_categoria) VALUES (?, ?, ?, ?, ?)',
    [nombre, descripcion, precio, cantidad_stock, id_categoria],
    (error, resultados) => {
      if (error) {
        res.status(500).json({ error: 'Error al crear el producto' });
      } else {
        res.status(201).json({ id: resultados.insertId, message: 'Producto creado' });
      }
    }
  );
};