const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'mysql.railway.internal',
  user: 'root',            // El usuario de MySQL en XAMPP
  password: 'iqsJTxaYDnlgAVIlIfxMlHyzqZaaSfkr',            // Si no le pusiste contraseña, déjalo vacío
  database: 'railway',  // Tu base de datos
  port: 3306               // Puerto que usa MySQL en XAMPP (por defecto)
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión:', err);
    return;
  }
  console.log('✅ Conectado a MySQL desde Node.js');
});

module.exports = db;
