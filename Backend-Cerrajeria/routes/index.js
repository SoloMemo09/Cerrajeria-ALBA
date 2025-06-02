const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Asegúrate de tener esto al inicio si no lo tienes

router.get('/api/productos', (req, res) => {
  const sql = `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.cantidad_stock,
      c.nombre AS categoria,
      pr.nombre AS proveedor
    FROM productos p
    JOIN categorias c ON p.id_categoria = c.id_categoria
    JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error('❌ Error al obtener productos:', err);
      return res.status(500).json({ error: 'Error al consultar productos' });
    }
    res.json(resultados); // Ahora sí envía un JSON con productos reales
  });
});
// ✅ Ruta para registrar una venta
router.post('/api/ventas', (req, res) => {
  const { carrito, direccion_envio, id_usuario } = req.body;

  if (!id_usuario || !carrito || carrito.length === 0 || !direccion_envio) {
    return res.status(400).json({ mensaje: 'Faltan datos para registrar la venta' });
  }

  const fecha = new Date();
  const total = carrito.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0);

  // Insertar en tabla pedidos
  const sqlPedido = 'INSERT INTO pedidos (id_usuario, fecha_pedido, estado_pedido, total) VALUES (?, ?, ?, ?)';
  db.query(sqlPedido, [id_usuario, fecha, 'Pendiente', total], (err, resultadoPedido) => {
    if (err) {
      console.error('❌ Error al crear pedido:', err);
      return res.status(500).json({ mensaje: 'Error al registrar el pedido' });
    }

    const id_pedido = resultadoPedido.insertId;

    // Insertar detalles del pedido
    const detalles = carrito.map(prod => [
      id_pedido,
      prod.id_producto,
      prod.cantidad,
      prod.precio,
      prod.precio * prod.cantidad
    ]);

    const sqlDetalles = `
      INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
      VALUES ?
    `;

    db.query(sqlDetalles, [detalles], (err) => {
      if (err) {
        console.error('❌ Error al insertar detalles:', err);
        return res.status(500).json({ mensaje: 'Error al guardar detalles del pedido' });
      }

      // Actualizar stock
      const updates = carrito.map(prod => {
        return new Promise((resolve, reject) => {
          db.query(
            'UPDATE productos SET cantidad_stock = cantidad_stock - ? WHERE id_producto = ?',
            [prod.cantidad, prod.id_producto],
            (err) => (err ? reject(err) : resolve())
          );
        });
      });

      Promise.all(updates)
        .then(() => {
          // Insertar registro en envíos
          const sqlEnvio = `
            INSERT INTO envios (id_pedido, direccion_envio, fecha_envio, estado_envio)
            VALUES (?, ?, ?, ?)
          `;
          db.query(sqlEnvio, [id_pedido, direccion_envio, fecha, 'En Camino'], (err) => {
            if (err) {
              console.error('❌ Error al registrar envío:', err);
              return res.status(500).json({ mensaje: 'Error al registrar el envío' });
            }

            res.json({
              mensaje: 'Venta registrada correctamente',
              exito: true,
              id_pedido // ✅ Este ID se usa en localStorage para validación
            });
          });
        })
        .catch((err) => {
          console.error('❌ Error al actualizar stock:', err);
          res.status(500).json({ mensaje: 'Error al actualizar inventario' });
        });
    });
  });
});

// ✅ Ruta para registrar un nuevo usuario
router.post('/api/registro', (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ exito: false, mensaje: 'Faltan datos' });
  }

  const sql = 'INSERT INTO usuarios (nombre, correo, password, tipo_usuario) VALUES (?, ?, ?, ?)';

  db.query(sql, [nombre, correo, contrasena, 'cliente'], (err, resultado) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ exito: false, mensaje: 'Este correo ya está registrado' });
      }
      console.error('❌ Error al registrar usuario:', err);
      return res.status(500).json({ exito: false, mensaje: 'Error en el servidor' });
    }

    res.json({ exito: true, mensaje: 'Usuario registrado correctamente' });
  });
});

router.post('/api/login', (req, res) => {
  const { correo, contrasena } = req.body;

  const sql = 'SELECT * FROM usuarios WHERE correo = ? LIMIT 1';

  db.query(sql, [correo], (err, resultados) => {
    if (err) {
      console.error('❌ Error al consultar login:', err);
      return res.status(500).json({ exito: false, mensaje: 'Error en el servidor' });
    }

    if (resultados.length === 0) {
      return res.json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    const usuario = resultados[0];

    if (usuario.password !== contrasena) {
      return res.json({ exito: false, mensaje: 'Contraseña incorrecta' });
    }

    res.json({
      exito: true,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        tipo_usuario: usuario.tipo_usuario
      }
    });
  });
});

// ✅ Alta de productos
router.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio, cantidad_stock, id_categoria, id_proveedor } = req.body;

  if (!nombre || !descripcion || !precio || !cantidad_stock || !id_categoria || !id_proveedor) {
    return res.status(400).json({ exito: false, mensaje: 'Faltan datos' });
  }

  const sql = `
    INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, id_categoria, id_proveedor)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, descripcion, precio, cantidad_stock, id_categoria, id_proveedor], (err, resultado) => {
    if (err) {
      console.error('❌ Error al guardar producto:', err);
      return res.status(500).json({ exito: false, mensaje: 'Error al guardar producto' });
    }

    res.json({ exito: true, mensaje: 'Producto registrado correctamente' });
  });
});

router.put('/api/productos/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, descripcion, precio, cantidad_stock, id_categoria, id_proveedor } = req.body;

  const sql = `
    UPDATE productos 
    SET nombre = ?, descripcion = ?, precio = ?, cantidad_stock = ?, id_categoria = ?, id_proveedor = ?
    WHERE id_producto = ?
  `;

  db.query(sql, [nombre, descripcion, precio, cantidad_stock, id_categoria, id_proveedor, id], (err) => {
    if (err) {
      console.error('❌ Error al actualizar:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar producto' });
    }

    res.json({ mensaje: 'Producto actualizado correctamente' });
  });
});

router.delete('/api/productos/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM productos WHERE id_producto = ?', [id], (err) => {
    if (err) {
      console.error('❌ Error al eliminar:', err);
      return res.status(500).json({ mensaje: 'Error al eliminar producto' });
    }

    res.json({ mensaje: 'Producto eliminado correctamente' });
  });
});


router.get('/api/usuarios', (req, res) => {
  const sql = 'SELECT id_usuario, nombre, apellido, correo, telefono, direccion, tipo_usuario FROM usuarios';

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error('❌ Error al obtener usuarios:', err);
      return res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
    res.json(resultados);
  });
});

router.put('/api/usuarios/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, apellido, correo, telefono, direccion, tipo_usuario } = req.body;

  const sql = `
    UPDATE usuarios
    SET nombre = ?, apellido = ?, correo = ?, telefono = ?, direccion = ?, tipo_usuario = ?
    WHERE id_usuario = ?
  `;

  db.query(sql, [nombre, apellido, correo, telefono, direccion, tipo_usuario, id], (err) => {
    if (err) {
      console.error('❌ Error al actualizar usuario:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar usuario' });
    }
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  });
});

router.delete('/api/usuarios/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id], (err) => {
    if (err) {
      console.error('❌ Error al eliminar usuario:', err);
      return res.status(500).json({ mensaje: 'Error al eliminar usuario' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  });
});

// ✅ Obtener todos los proveedores
router.get('/api/proveedores', (req, res) => {
  const sql = 'SELECT * FROM proveedores';
  db.query(sql, (err, resultados) => {
    if (err) {
      console.error('Error al obtener proveedores:', err);
      return res.status(500).json({ mensaje: 'Error al obtener proveedores' });
    }
    res.json(resultados);
  });
});

// ✅ Agregar nuevo proveedor
router.post('/api/proveedores', (req, res) => {
  const { nombre, correo, telefono } = req.body;

  if (!nombre || !correo || !telefono) {
    return res.status(400).json({ exito: false, mensaje: 'Faltan datos' });
  }

  const sql = 'INSERT INTO proveedores (nombre, correo, telefono) VALUES (?, ?, ?)';
  db.query(sql, [nombre, correo, telefono], (err) => {
    if (err) {
      console.error('Error al agregar proveedor:', err);
      return res.status(500).json({ exito: false, mensaje: 'Error al guardar proveedor' });
    }
    res.json({ exito: true, mensaje: 'Proveedor agregado correctamente' });
  });
});

// ✅ Actualizar proveedor
router.put('/api/proveedores/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, correo, telefono } = req.body;

  const sql = `
    UPDATE proveedores
    SET nombre = ?, correo = ?, telefono = ?
    WHERE id_proveedor = ?
  `;

  db.query(sql, [nombre, correo, telefono, id], (err) => {
    if (err) {
      console.error('Error al actualizar proveedor:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar proveedor' });
    }
    res.json({ mensaje: 'Proveedor actualizado correctamente' });
  });
});

// ✅ Eliminar proveedor
router.delete('/api/proveedores/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM proveedores WHERE id_proveedor = ?', [id], (err) => {
    if (err) {
      console.error('Error al eliminar proveedor:', err);
      return res.status(500).json({ mensaje: 'Error al eliminar proveedor' });
    }
    res.json({ mensaje: 'Proveedor eliminado correctamente' });
  });
});

router.post('/api/usuarios', (req, res) => {
  const { nombre, apellido, correo, telefono, direccion, tipo_usuario, password } = req.body;

  if (!nombre || !apellido || !correo || !telefono || !direccion || !tipo_usuario || !password) {
    return res.status(400).json({ exito: false, mensaje: 'Faltan datos del usuario' });
  }

  const sql = `
    INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, tipo_usuario, password)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, apellido, correo, telefono, direccion, tipo_usuario, password], (err) => {
    if (err) {
      console.error('Error al registrar usuario:', err);
      return res.status(500).json({ exito: false, mensaje: 'Error al registrar usuario' });
    }

    res.json({ exito: true, mensaje: 'Usuario registrado correctamente' });
  });
});
router.get('/api/categorias', (req, res) => {
  db.query('SELECT * FROM categorias', (err, resultados) => {
    if (err) {
      console.error('Error al obtener categorías:', err);
      return res.status(500).json({ mensaje: 'Error al obtener categorías' });
    }

    res.json(resultados);
  });
});

// Crear una nueva categoría
router.post('/api/categorias', (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ exito: false, mensaje: 'Nombre requerido' });
  }

  const sql = 'INSERT INTO categorias (nombre) VALUES (?)';
  db.query(sql, [nombre], (err) => {
    if (err) {
      console.error('Error al crear categoría:', err);
      return res.status(500).json({ exito: false, mensaje: 'Error al crear categoría' });
    }

    res.json({ exito: true, mensaje: 'Categoría registrada correctamente' });
  });
});

// Actualizar una categoría
router.put('/api/categorias/:id', (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ mensaje: 'Nombre requerido' });
  }

  const sql = 'UPDATE categorias SET nombre = ? WHERE id_categoria = ?';
  db.query(sql, [nombre, id], (err) => {
    if (err) {
      console.error('Error al actualizar categoría:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar categoría' });
    }

    res.json({ mensaje: 'Categoría actualizada correctamente' });
  });
});

// Eliminar una categoría
router.delete('/api/categorias/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM categorias WHERE id_categoria = ?', [id], (err) => {
    if (err) {
      console.error('Error al eliminar categoría:', err);
      return res.status(500).json({ mensaje: 'Error al eliminar categoría' });
    }

    res.json({ mensaje: 'Categoría eliminada correctamente' });
  });
});

router.get('/api/historial/:id_usuario', (req, res) => {
  const id_usuario = req.params.id_usuario;

  const sql = `
    SELECT p.id_pedido, p.fecha_pedido, p.estado_pedido, p.total,
           e.id_envio, e.direccion_envio, e.estado_envio
    FROM pedidos p
    LEFT JOIN envios e ON p.id_pedido = e.id_pedido
    WHERE p.id_usuario = ?
    ORDER BY p.fecha_pedido DESC
  `;

  db.query(sql, [id_usuario], (err, pedidos) => {
    if (err) {
      console.error('❌ Error al consultar historial individual:', err);
      return res.status(500).json({ mensaje: 'Error al obtener historial' });
    }

    res.json(pedidos);
  });
});

router.get('/api/historial', (req, res) => {
  const sql = `
    SELECT p.id_pedido, p.fecha_pedido, p.estado_pedido, p.total,
           u.nombre AS nombre_usuario,
           e.id_envio, e.direccion_envio, e.estado_envio
    FROM pedidos p
    JOIN usuarios u ON p.id_usuario = u.id_usuario
    LEFT JOIN envios e ON p.id_pedido = e.id_pedido
    ORDER BY p.fecha_pedido DESC
  `;

  db.query(sql, (err, pedidos) => {
    if (err) {
      console.error('❌ Error al consultar historial global:', err);
      return res.status(500).json({ mensaje: 'Error al obtener historial' });
    }

    res.json(pedidos);
  });
});

router.put('/api/envios/:id_envio', (req, res) => {
  const { estado_envio } = req.body;
  const { id_envio } = req.params;

  // 1. Primero, actualizar el estado en la tabla envios
  const sqlUpdateEnvio = `UPDATE envios SET estado_envio = ? WHERE id_envio = ?`;

  db.query(sqlUpdateEnvio, [estado_envio, id_envio], (err, result) => {
    if (err) {
      console.error('❌ Error al actualizar estado en envios:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar estado del envío' });
    }

    // 2. Luego, obtener el id_pedido relacionado con ese envío
    const sqlGetPedido = `SELECT id_pedido FROM envios WHERE id_envio = ?`;

    db.query(sqlGetPedido, [id_envio], (err, rows) => {
      if (err || rows.length === 0) {
        console.error('❌ Error al obtener id_pedido:', err);
        return res.status(500).json({ mensaje: 'Error al obtener pedido relacionado' });
      }

      const id_pedido = rows[0].id_pedido;

      // 3. Finalmente, actualizar el estado en la tabla pedidos
      const sqlUpdatePedido = `UPDATE pedidos SET estado_pedido = ? WHERE id_pedido = ?`;

      db.query(sqlUpdatePedido, [estado_envio, id_pedido], (err, result) => {
        if (err) {
          console.error('❌ Error al actualizar estado en pedidos:', err);
          return res.status(500).json({ mensaje: 'Error al actualizar estado del pedido' });
        }

        res.json({ mensaje: 'Estado actualizado correctamente en envío y pedido' });
      });
    });
  });
});

router.get('/api/ultimo-pedido/:id_usuario', (req, res) => {
  const { id_usuario } = req.params;
  const sql = `SELECT id_pedido FROM pedidos WHERE id_usuario = ? ORDER BY fecha_pedido DESC LIMIT 1`;

  db.query(sql, [id_usuario], (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error interno' });
    if (resultados.length === 0) return res.json({ mensaje: 'No hay pedidos' });
    res.json({ id_pedido: resultados[0].id_pedido });
  });
});

router.post('/api/pagos', (req, res) => {
  const { nombre, tarjeta, fecha_vencimiento, cvv, fecha, id_usuario } = req.body;

  const sql = `
    INSERT INTO pagos (nombre, tarjeta, fecha_vencimiento, cvv, fecha, id_usuario)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, tarjeta, fecha_vencimiento, cvv, fecha, id_usuario], (err) => {
    if (err) {
      console.error('❌ Error al registrar pago:', err);
      return res.status(500).json({ exito: false, mensaje: 'Error al registrar el pago' });
    }

    res.json({ exito: true, mensaje: '✅ Pago registrado correctamente' });
  });
});



module.exports = router;
