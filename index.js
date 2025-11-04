require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db"); // tu conexión MySQL con mysql2/promise

const app = express();

// Configurar CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware para leer JSON
app.use(express.json());

// ✅ Ruta para probar el backend
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "✅ Backend funcionando correctamente!" });
});

// ✅ Obtener todos los usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).send("Error al obtener usuarios");
  }
});

// ✅ Login con MySQL
app.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;
  console.log("📩 Datos recibidos:", req.body);

  if (!usuario || !contrasena) {
    return res.status(400).json({ message: "❌ Faltan datos" });
  }

  try {
    console.log("🔍 Ejecutando consulta en MySQL...");
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?",
      [usuario, contrasena]
    );
    console.log("✅ Consulta ejecutada, resultado:", rows);

    if (rows.length > 0) {
      console.log("✅ Usuario autenticado:", usuario);
      return res.status(200).json({ message: "✅ Login exitoso" });
    } else {
      console.log("❌ Credenciales inválidas para:", usuario);
      return res.status(401).json({ message: "❌ Credenciales inválidas" });
    }

  } catch (err) {
    console.error("⚠️ Error en la consulta:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// ✅ Registrar nuevo usuario
app.post("/register", async (req, res) => {
  const { nombre, usuario, contrasena } = req.body;
  console.log("📩 Datos recibidos en /register:", req.body);

  if (!nombre || !usuario || !contrasena) {
    return res.status(400).json({ message: "❌ Faltan datos" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO usuarios (nombre, usuario, contrasena) VALUES (?, ?, ?)",
      [nombre, usuario, contrasena]
    );
    console.log("✅ Usuario insertado con ID:", result.insertId);
    res.status(201).json({ message: "✅ Usuario registrado con éxito", id: result.insertId });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// ✅ Últimos usuarios
app.get("/usuarios/latest", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM usuarios ORDER BY id DESC LIMIT 5");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});


// ✅ ENDPOINT GET LISTADO DE PRODUCTOS
app.get("/productos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM productos"); 
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor funcionando en el puerto ${PORT}`));

