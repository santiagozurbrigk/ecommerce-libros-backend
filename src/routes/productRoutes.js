const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { getUploadConfig } = require('../config/upload');
const { validateProduct, handleValidationErrors } = require('../middlewares/validation');
const auth = require('../middlewares/auth');

// Obtener la configuración de upload (S3 o local)
const upload = getUploadConfig();

// Crear producto (solo admin)
router.post('/', auth, upload.single('image'), validateProduct, handleValidationErrors, productController.createProduct);

// Listar productos (público)
router.get('/', productController.getProducts);

// Editar producto (solo admin)
router.put('/:id', auth, upload.single('image'), validateProduct, handleValidationErrors, productController.updateProduct);

// Eliminar producto (solo admin)
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router; 