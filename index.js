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
  const { nombre, descripcion, precio, stock, imagen, categoria } = req.body;

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
      "INSERT INTO productos (nombre, descripcion, precio, stock, imagen, categoria) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, descripcion, precioFinal, stock ?? 0, imagen, categoria || "General"]
    );

    res.status(201).json({ message: "Producto registrado", id: result.insertId });

  } catch (err) {
    res.status(500).json({ message: "Error al registrar producto" });
  }
});

// PUT actualizar producto
app.put("/productos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, imagen, categoria } = req.body;

  try {
    await db.query(
      "UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=?, imagen=?, categoria=? WHERE id=?",
      [nombre, descripcion, precio, stock, imagen, categoria, id]
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
// INICIAR SERVIDOR
// =============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor funcionando en el puerto ${PORT}`));
