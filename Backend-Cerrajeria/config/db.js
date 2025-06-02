const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',            // El usuario de MySQL en XAMPP
  password: '',            // Si no le pusiste contraseña, déjalo vacío
  database: 'cerrajeria_alba',  // Tu base de datos
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
