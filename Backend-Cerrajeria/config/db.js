const mysql = require('mysql2');

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",       // si dejaste sin contraseña
  database: "cerrajeria_alba",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error de conexión:", err);
    return;
  }
  console.log("✅ Conectado a MySQL local");
});

module.exports = db;
