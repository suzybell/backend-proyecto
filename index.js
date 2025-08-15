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

app.listen(3000, () => {
  console.log("Servidor funcionando correctamente 🚀");
});
