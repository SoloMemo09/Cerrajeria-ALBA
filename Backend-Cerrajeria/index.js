const express = require('express');
const cors = require('cors');
const app = express();

// ✅ Importa el archivo de rutas (routes/index.js)
const rutas = require('./routes/index');

app.use(cors());
app.use(express.json());

// ✅ Usa las rutas definidas en el router
app.use(rutas);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
