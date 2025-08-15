const mysql = require("mysql2");

// Configura la conexión a MySQL
const connection = mysql.createConnection({
  host: "localhost",       // Servidor
  user: "root",             // Usuario de MySQL (cambia si tienes otro)
  password: "",             // Contraseña de MySQL
  database: "script_backend" // Nombre de tu base de datos
});

// Conectar
connection.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
    return;
  }
  console.log("✅ Conexión a MySQL exitosa!");
});

module.exports = connection;
