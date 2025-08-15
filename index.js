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

// Endpoint POST para login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Aquí va tu lógica real con la base de datos
  if (username === "admin" && password === "1234") {
    res.status(200).json({ message: "Login exitoso" });
  } else {
    res.status(401).json({ message: "Usuario o contraseña incorrecta" });
  }
});

// Endpoint raíz para test simple
app.get("/", (req, res) => {
  res.send("✅ Backend funcionando correctamente!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor funcionando correctamente 🚀 en el puerto ${PORT}`);
});
