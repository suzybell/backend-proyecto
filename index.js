require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db"); // conexión MySQL con mysql2/promise

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

// Obtener todos los usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).send("Error al obtener usuarios");
  }
});

// Login
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
      return res.status(200).json({ message: "✅ Login exitoso" });
    } else {
      return res.status(401).json({ message: "❌ Credenciales inválidas" });
    }

  } catch (err) {
    console.error("⚠️ Error:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Registrar nuevo usuario
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

    res.status(201).json({ message: "Usuario registrado con éxito", id: result.insertId });

  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});


// =============================
//     PRODUCTOS
// =============================

// GET: obtener todos los productos
app.get("/productos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM productos");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// POST: registrar nuevo producto
app.post("/productos", async (req, res) => {
  const { nombre, descripcion, precio, stock, imagen, categoria } = req.body;

  // Validación básica
  if (!nombre || !precio) {
    return res.status(400).json({ message: "❌ Nombre y precio son obligatorios" });
  }

  // Validar formato de precio
  const precioTexto = String(precio);

  if (!/^\d+(\.\d{1,2})?$/.test(precioTexto)) {
    return res.status(400).json({
      message: "❌ El precio debe ser un número sin puntos ni símbolos. Ejemplo: 10000 o 10000.50"
    });
  }

  // Eliminar separadores de miles
  const precioSinSeparadores = precioTexto.replace(/\./g, "");
  const precioFinal = parseFloat(precioSinSeparadores);

  try {
    const [result] = await db.query(
      "INSERT INTO productos (nombre, descripcion, precio, stock, imagen, categoria) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, descripcion, precioFinal, stock ?? 0, imagen, categoria || "General"]
    );

    res.status(201).json({
      message: "Producto registrado con éxito",
      id: result.insertId
    });

  } catch (err) {
    console.error("❌ Error al registrar producto:", err);
    res.status(500).json({ message: "Error al registrar producto" });
  }
});

// DELETE: eliminar producto por id
app.delete("/productos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM productos WHERE id = ?", [id]);
    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
});


// =============================
//     INICIAR SERVIDOR
// =============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor funcionando en el puerto ${PORT}`));
