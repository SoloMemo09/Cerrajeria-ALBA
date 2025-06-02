const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos');

// GET /api/productos
router.get('/', productosController.getAll);

// POST /api/productos
router.post('/', productosController.create);

module.exports = router;