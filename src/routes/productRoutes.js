const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { getUploadConfig } = require('../config/upload');

// Obtener la configuración de upload (S3 o local)
const upload = getUploadConfig();

// Crear producto
router.post('/', upload.single('image'), productController.createProduct);

// Listar productos
router.get('/', productController.getProducts);

// Editar producto
router.put('/:id', upload.single('image'), productController.updateProduct);

// Eliminar producto
router.delete('/:id', productController.deleteProduct);

module.exports = router; 