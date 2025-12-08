require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

// Configurar CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware para leer JSON
app.use(express.json());

// =============================
//     PRUEBA DEL BACKEND
// =============================
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "✅ Backend funcionando correctamente!" });
});

// =============================
//     USUARIOS
// =============================
app.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

app.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ message: "❌ Faltan datos" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?",
      [usuario, contrasena]
    );

    if (rows.length > 0) {
      return res.json({ message: "Login exitoso" });
    }

    return res.status(401).json({ message: "❌ Credenciales inválidas" });

  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.post("/register", async (req, res) => {
  const { nombre, usuario, contrasena } = req.body;

  if (!nombre || !usuario || !contrasena) {
    return res.status(400).json({ message: "❌ Faltan datos" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO usuarios (nombre, usuario, contrasena) VALUES (?, ?, ?)",
      [nombre, usuario, contrasena]
    );

    res.status(201).json({ message: "Usuario registrado", id: result.insertId });

  } catch (err) {
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// =============================
//     PRODUCTOS
// =============================

// GET todos los productos
app.get("/productos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM productos");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// GET producto por ID
app.get("/productos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query("SELECT * FROM productos WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ message: "Error al obtener producto" });
  }
});

// POST crear producto
app.post("/productos", async (req, res) => {
  const { nombre, descripcion, precio, precio_oferta, stock, imagen, categoria } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({ message: "Nombre y precio son obligatorios" });
  }

  const precioTexto = String(precio);

  if (!/^\d+(\.\d{1,2})?$/.test(precioTexto)) {
    return res.status(400).json({
      message: "El precio debe ser un número válido. Ej: 10000 o 10000.50"
    });
  }

  const precioFinal = parseFloat(precioTexto.replace(/\./g, ""));

  try {
    const [result] = await db.query(
      "INSERT INTO productos (nombre, descripcion, precio, precio_oferta, stock, imagen, categoria) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre, descripcion, precioFinal, precio_oferta || null, stock ?? 0, imagen, categoria || "General"]
    );

    res.status(201).json({ message: "Producto registrado", id: result.insertId });

  } catch (err) {
    res.status(500).json({ message: "Error al registrar producto" });
  }
});


// PUT actualizar producto
app.put("/productos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, precio_oferta, stock, imagen, categoria } = req.body;

  try {
    await db.query(
      "UPDATE productos SET nombre=?, descripcion=?, precio=?, precio_oferta=?, stock=?, imagen=?, categoria=? WHERE id=?",
      [nombre, descripcion, precio, precio_oferta || null, stock, imagen, categoria, id]
    );

    res.json({ message: "Producto actualizado" });

  } catch (err) {
    res.status(500).json({ message: "Error al actualizar producto" });
  }
});


// DELETE eliminar producto
app.delete("/productos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM productos WHERE id = ?", [id]);
    res.json({ message: "Producto eliminado" });

  } catch (err) {
    res.status(500).json({ message: "Error al eliminar producto" });
  }
});

// =============================
//   CARRITO: Agregar producto
// =============================
app.post("/carrito/agregar", async (req, res) => {
  const { usuario_id, producto_id, cantidad } = req.body;

  if (!usuario_id || !producto_id) {
    return res.status(400).json({ message: "usuario_id y producto_id son obligatorios" });
  }

  try {
    // 1️⃣ Verificar si el producto YA está en el carrito
    const [existe] = await db.query(
      "SELECT * FROM carrito WHERE usuario_id = ? AND producto_id = ?",
      [usuario_id, producto_id]
    );

    if (existe.length > 0) {
      // 2️⃣ Si ya existe, aumentar cantidad
      await db.query(
        "UPDATE carrito SET cantidad = cantidad + ? WHERE usuario_id = ? AND producto_id = ?",
        [cantidad ?? 1, usuario_id, producto_id]
      );

      return res.json({ message: "Cantidad actualizada en el carrito" });
    }

    // 3️⃣ Si NO existe, insertar producto
    await db.query(
      "INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)",
      [usuario_id, producto_id, cantidad ?? 1]
    );

    res.json({ message: "Producto agregado al carrito" });

  } catch (err) {
    console.error("❌ Error al agregar al carrito:", err);
    res.status(500).json({ message: "Error al agregar al carrito" });
  }
});


// =============================
//   CARRITO: Obtener carrito por usuario
// =============================
app.get("/carrito/:usuario_id", async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        c.id AS carrito_id,
        c.cantidad,
        p.id AS producto_id,
        p.nombre,
        p.precio,
        p.precio_oferta,
        p.imagen
      FROM carrito c
      INNER JOIN productos p ON c.producto_id = p.id
      WHERE c.usuario_id = ?
    `, [usuario_id]);

    // Calcular totales
    const carrito = rows.map(item => {
      const precioFinal = item.precio_oferta && item.precio_oferta > 0
        ? item.precio_oferta
        : item.precio;

      return {
        carrito_id: item.carrito_id,
        producto_id: item.producto_id,
        nombre: item.nombre,
        imagen: item.imagen,
        cantidad: item.cantidad,
        precio_unitario: precioFinal,
        total_producto: precioFinal * item.cantidad
      };
    });

    // Total general
    const total_general = carrito.reduce((sum, item) => sum + item.total_producto, 0);

    res.json({ carrito, total_general });

  } catch (err) {
    console.error("❌ Error al obtener carrito:", err);
    res.status(500).json({ message: "Error al obtener carrito" });
  }
});

// =============================
//   CARRITO: Actualizar cantidad
// =============================
app.put("/carrito/actualizar", async (req, res) => {
  const { usuario_id, producto_id, cantidad } = req.body;

  if (!usuario_id || !producto_id || !cantidad) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  if (cantidad < 1) {
    return res.status(400).json({ message: "La cantidad mínima es 1" });
  }

  try {
    const [result] = await db.query(
      "UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?",
      [cantidad, usuario_id, producto_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado en carrito" });
    }

    res.json({ message: "Cantidad actualizada correctamente" });

  } catch (err) {
    console.error("❌ Error al actualizar cantidad:", err);
    res.status(500).json({ message: "Error al actualizar cantidad" });
  }
});

// =============================
//   CARRITO: Eliminar producto
// =============================
app.delete("/carrito/eliminar", async (req, res) => {
  const { usuario_id, producto_id } = req.body;

  if (!usuario_id || !producto_id) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?",
      [usuario_id, producto_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no estaba en el carrito" });
    }

    res.json({ message: "Producto eliminado del carrito" });

  } catch (err) {
    console.error("❌ Error al eliminar del carrito:", err);
    res.status(500).json({ message: "Error al eliminar producto del carrito" });
  }
});

// =====================================
//   CARRITO: Vaciar todo el carrito
// =====================================
app.delete("/carrito/vaciar", async (req, res) => {
  const { usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ message: "Falta usuario_id" });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM carrito WHERE usuario_id = ?",
      [usuario_id]
    );

    res.json({ 
      message: "Carrito vaciado correctamente",
      items_eliminados: result.affectedRows
    });

  } catch (err) {
    console.error("❌ Error al vaciar el carrito:", err);
    res.status(500).json({ message: "Error al vaciar el carrito" });
  }
});


// =============================
//     CHECKOUT & PAGOS
// =============================

// 1. Obtener métodos de pago disponibles
app.get("/metodos-pago", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM metodos_pago");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener métodos de pago:", err);
    res.status(500).json({ message: "Error al obtener métodos de pago" });
  }
});

// 2. Obtener detalles de una orden específica
app.get("/orden/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener la orden principal
    const [orden] = await db.query(`
      SELECT o.*, mp.nombre as metodo_pago_nombre
      FROM ordenes o
      LEFT JOIN metodos_pago mp ON o.metodo_pago_id = mp.id
      WHERE o.id = ?
    `, [id]);

    if (orden.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    // Obtener los productos de la orden
    const [detalles] = await db.query(`
      SELECT 
        do.*,
        p.nombre as producto_nombre,
        p.imagen
      FROM detalle_orden do
      JOIN productos p ON do.producto_id = p.id
      WHERE do.orden_id = ?
    `, [id]);

    res.json({
      orden: orden[0],
      detalles
    });

  } catch (err) {
    console.error("❌ Error al obtener orden:", err);
    res.status(500).json({ message: "Error al obtener orden" });
  }
});

// 3. Procesar checkout (EL MÁS IMPORTANTE)
app.post("/checkout", async (req, res) => {
  const { usuario_id, direccion_envio, ciudad_envio, telefono_contacto, metodo_pago_id } = req.body;

  // Validar campos obligatorios
  if (!usuario_id || !direccion_envio || !ciudad_envio || !telefono_contacto || !metodo_pago_id) {
    return res.status(400).json({ 
      message: "❌ Todos los campos son obligatorios" 
    });
  }

  try {
    // 1. Obtener conexión de la base de datos
    const connection = await db.getConnection();
    
    // 2. Iniciar transacción
    await connection.beginTransaction();

    // 3. Obtener carrito del usuario con información completa
    const [carrito] = await connection.query(`
      SELECT 
        c.producto_id,
        c.cantidad,
        p.nombre,
        p.precio,
        p.stock
      FROM carrito c
      JOIN productos p ON c.producto_id = p.id
      WHERE c.usuario_id = ?
    `, [usuario_id]);

    // 4. Validar que el carrito no esté vacío
    if (carrito.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        message: "❌ El carrito está vacío" 
      });
    }

    // 5. Validar stock disponible
    for (const item of carrito) {
      if (item.cantidad > item.stock) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          message: `❌ Stock insuficiente para: ${item.nombre}. Disponible: ${item.stock}` 
        });
      }
    }

    // 6. Calcular el total
    const total = carrito.reduce((sum, item) => {
      return sum + (parseFloat(item.precio) * item.cantidad);
    }, 0);

    // 7. Crear la orden principal
    const [resultOrden] = await connection.query(`
      INSERT INTO ordenes (
        usuario_id, 
        total, 
        direccion_envio, 
        ciudad_envio, 
        telefono_contacto, 
        metodo_pago_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [usuario_id, total, direccion_envio, ciudad_envio, telefono_contacto, metodo_pago_id]);

    const ordenId = resultOrden.insertId;

    // 8. Guardar productos en detalle_orden y actualizar stock
    for (const item of carrito) {
      const subtotal = parseFloat(item.precio) * item.cantidad;
      
      // Insertar en detalle_orden
      await connection.query(`
        INSERT INTO detalle_orden (
          orden_id, 
          producto_id, 
          cantidad, 
          precio_unitario, 
          subtotal
        ) VALUES (?, ?, ?, ?, ?)
      `, [ordenId, item.producto_id, item.cantidad, item.precio, subtotal]);

      // Actualizar stock
      await connection.query(`
        UPDATE productos 
        SET stock = stock - ? 
        WHERE id = ?
      `, [item.cantidad, item.producto_id]);
    }

    // 9. Vaciar el carrito
    await connection.query('DELETE FROM carrito WHERE usuario_id = ?', [usuario_id]);

    // 10. Confirmar transacción
    await connection.commit();
    connection.release();

    // 11. Obtener datos del usuario para el correo
    const [usuarios] = await db.query(
      "SELECT email, nombre FROM usuarios WHERE id = ?", 
      [usuario_id]
    );
    
    const usuario = usuarios[0];

    // 12. Obtener método de pago
    const [metodosPago] = await db.query(
      "SELECT nombre FROM metodos_pago WHERE id = ?", 
      [metodo_pago_id]
    );
    
    const metodoPagoNombre = metodosPago[0]?.nombre || 'No especificado';

    // 13. Enviar correo de confirmación (si hay email configurado)
    if (process.env.EMAIL_USER && usuario && usuario.email) {
      try {
        const { enviarCorreo } = require('./utils/mailer');
        
        const htmlCorreo = `
          <h1>¡Gracias por tu compra, ${usuario.nombre}!</h1>
          <p>Tu pedido <strong>#${ordenId}</strong> ha sido recibido y está siendo procesado.</p>
          <h2>Resumen del Pedido:</h2>
          <ul>
            ${carrito.map(item => `
              <li>${item.nombre} - ${item.cantidad} x $${item.precio.toLocaleString()}</li>
            `).join('')}
          </ul>
          <p><strong>Total: $${total.toLocaleString()}</strong></p>
          <p>Método de pago: ${metodoPagoNombre}</p>
          <p>Dirección de envío: ${direccion_envio}, ${ciudad_envio}</p>
          <p>Teléfono de contacto: ${telefono_contacto}</p>
          <p>Te contactaremos si hay algún inconveniente con tu pedido.</p>
        `;

        await enviarCorreo({
          to: usuario.email,
          subject: `✅ Confirmación de Pedido #${ordenId}`,
          html: htmlCorreo
        });

        console.log(`📧 Correo enviado a ${usuario.email}`);
        
      } catch (emailError) {
        console.error("⚠️ Error al enviar correo (pero la orden se creó):", emailError);
        // No retornamos error porque la orden ya se creó exitosamente
      }
    }

    // 14. Responder con éxito
    res.status(201).json({
      message: "✅ Orden creada exitosamente",
      orden_id: ordenId,
      total: total,
      detalles: carrito.map(item => ({
        producto: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio
      }))
    });

  } catch (err) {
    console.error("❌ Error en checkout:", err);
    
    // Revertir cambios si hubo error
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    
    res.status(500).json({ 
      message: "Error al procesar la compra",
      error: err.message 
    });
  }
});

// 4. Obtener órdenes de un usuario
app.get("/ordenes/usuario/:usuario_id", async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [ordenes] = await db.query(`
      SELECT 
        o.*,
        mp.nombre as metodo_pago_nombre,
        COUNT(do.id) as total_productos
      FROM ordenes o
      LEFT JOIN metodos_pago mp ON o.metodo_pago_id = mp.id
      LEFT JOIN detalle_orden do ON o.id = do.orden_id
      WHERE o.usuario_id = ?
      GROUP BY o.id
      ORDER BY o.fecha DESC
    `, [usuario_id]);

    res.json(ordenes);

  } catch (err) {
    console.error("❌ Error al obtener órdenes:", err);
    res.status(500).json({ message: "Error al obtener órdenes" });
  }
});

// =============================
// INICIAR SERVIDOR
// =============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor funcionando en el puerto ${PORT}`));
