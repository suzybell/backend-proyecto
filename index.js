const express = require("express");
const app = express();
const db = require("./db"); // tu conexión MySQL

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
  const { username, password } = req.body;

  // Consulta SQL para verificar usuario y contraseña
  const query = "SELECT * FROM usuarios WHERE username = ? AND password = ?";

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Error al consultar usuarios:", err);
      return res.status(500).json({ message: "Error en el servidor" });
    }

    if (results.length > 0) {
      // Usuario encontrado
      res.status(200).json({ message: "Login exitoso", user: results[0] });
    } else {
      // Usuario no encontrado
      res.status(401).json({ message: "Usuario o contraseña incorrecta" });
    }
  });
});

// Endpoint raíz para test simple
app.get("/", (req, res) => {
  res.send("✅ Backend funcionando correctamente!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor funcionando correctamente 🚀 en el puerto ${PORT}`);
});
