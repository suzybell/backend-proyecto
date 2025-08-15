const express = require("express");
const app = express();
const db = require("./db"); // tu conexión MySQL

app.use(express.json());

app.get("/usuarios", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, results) => {
    if (err) {
      res.status(500).send("Error al obtener usuarios");
      return;
    }
    res.json(results);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando correctamente 🚀 en el puerto ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("✅ Backend funcionando correctamente!");
});
