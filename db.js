const mysql = require("mysql2");

// Configura la conexión a MySQL
const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

// Conectar
connection.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
    return;
  }
  console.log("✅ Conexión a MySQL exitosa!");

  // PRUEBA RÁPIDA
  connection.query("SELECT 1 + 1 AS resultado", (err, results) => {
    if (err) console.error("❌ Error de prueba:", err);
    else console.log("✅ Prueba de conexión OK:", results);
  });
});

module.exports = connection;
