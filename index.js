require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db"); // tu conexión MySQL

const app = express();

// Habilitar CORS
app.use(cors());

// Middleware para leer JSON
app.use(express.json());

// Endpoint GET para usuarios
app.get("/usuarios", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, results) => {
    if (err) {
      res.status(500).send("Error al obtener usuarios");
      return;
    }
    res.json(results);
  });
});

// Endpoint POST para login real con la base de datos
app.post("/login", (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  const query = "SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?";
  db.query(query, [usuario, contrasena], (err, results) => {
    if (err) {
      console.error("❌ Error en la consulta:", err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (results.length > 0) {
      return res.status(200).json({ message: "✅ Login exitoso" });
    } else {
      return res.status(401).json({ message: "❌ Credenciales inválidas" });
    }
  });
});


// Endpoint para registrar un nuevo usuario
app.post("/register", (req, res) => {
   console.log("📩 Datos recibidos en /register:", req.body);
  const { nombre, usuario, contrasena } = req.body;

  if (!nombre || !usuario || !contrasena) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  const query = "INSERT INTO usuarios (nombre, usuario, contrasena) VALUES (?, ?, ?)";
  db.query(query, [nombre, usuario, contrasena], (err, result) => {
    if (err) {
      console.error("❌ Error al registrar:", err);
      return res.status(500).json({ message: "Error al registrar usuario" });
    }

    return res.status(201).json({ message: "✅ Usuario registrado con éxito" });
  });
});



// Endpoint raíz para test simple
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "✅ Backend funcionando correctamente!" });
});


const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor funcionando correctamente 🚀 en el puerto ${PORT}`);
});

