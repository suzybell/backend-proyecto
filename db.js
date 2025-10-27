const mysql = require("mysql2/promise");

// Crear un pool de conexiones
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10, // máximo 10 conexiones activas
  queueLimit: 0
});

// Probar la conexión al iniciar
(async () => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS resultado");
    console.log("✅ Conexión a MySQL exitosa! Resultado de prueba:", rows);
  } catch (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
  }
})();

module.exports = pool;

