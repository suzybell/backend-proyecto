
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

aapp.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ message: "❌ Faltan datos" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, usuario, nombre FROM usuarios WHERE usuario = ? AND contrasena = ?",
      [usuario, contrasena]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "❌ Credenciales inválidas" });
    }

    return res.json({
      mensaje: "Login exitoso",
      usuario: rows[0]
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error en servidor" });
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
  console.log("🎯 ENDPOINT /carrito/agregar LLAMADO");
  console.log("Body recibido:", req.body);
  
  const { usuario_id, producto_id, cantidad } = req.body;

  if (!usuario_id || !producto_id) {
    console.log("❌ Faltan datos: usuario_id o producto_id");
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


app.post('/checkout', async (req, res) => {
  const { usuario_id, direccion_envio, ciudad_envio, telefono_contacto, metodo_pago_id } = req.body;

  try {

    // 1. Obtener carrito del usuario
    const [carrito] = await db.query(`
      SELECT 
        c.id AS carrito_id,
        c.producto_id,
        c.cantidad,
        p.precio
      FROM carrito c
      INNER JOIN productos p ON c.producto_id = p.id
      WHERE c.usuario_id = ?
    `, [usuario_id]);

    console.log("Carrito recibido en checkout:", carrito);

    if (carrito.length === 0) {
      return res.status(400).json({ mensaje: "El carrito está vacío" });
    }

    // 2. Calcular total
    let total = 0;

    carrito.forEach(item => {
      const precio = Number(item.precio);
      total += precio * item.cantidad;
    });

    // 3. Crear orden
    const [orden] = await db.query(`
      INSERT INTO ordenes (usuario_id, total, direccion_envio, ciudad_envio, telefono_contacto, metodo_pago_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      usuario_id,
      total,
      direccion_envio,
      ciudad_envio,
      telefono_contacto,
      metodo_pago_id
    ]);

    const orden_id = orden.insertId;

    // 4. Insertar detalles
    for (const item of carrito) {
      await db.query(`
        INSERT INTO detalle_orden (orden_id, producto_id, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [
        orden_id,
        item.producto_id,
        item.cantidad,
        item.precio,
        Number(item.precio) * item.cantidad
      ]);
    }

    // 5. Vaciar carrito
    await db.query("DELETE FROM carrito WHERE usuario_id = ?", [usuario_id]);

    // 6. Respuesta final
    res.json({
      mensaje: "Compra realizada con éxito",
      total: total,
      orden_id: orden_id,
      estado: "pendiente"
    });

  } catch (error) {
    console.log("Error en checkout:", error);
    res.status(500).json({ mensaje: "Error en el proceso de checkout" });
  }
});

// =============================
//     ORDENES DEL USUARIO
// =============================
app.get("/ordenes/:usuario_id", async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [ordenes] = await db.query(`
      SELECT * 
      FROM ordenes
      WHERE usuario_id = ?
      ORDER BY fecha DESC
    `, [usuario_id]);

    res.json(ordenes);

  } catch (error) {
    console.error("❌ Error al obtener órdenes:", error);
    res.status(500).json({ message: "Error al obtener órdenes" });
  }
});


// =============================
// INICIAR SERVIDOR
// =============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor funcionando en el puerto ${PORT}`));
