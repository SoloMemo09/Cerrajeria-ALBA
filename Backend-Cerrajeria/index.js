const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// ✅ Importa rutas Soy memo
const rutas = require('./routes/index');

app.use(cors());
app.use(express.json());

// ✅ Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Usar rutas API
app.use(rutas);

// ✅ Puerto para local o Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
