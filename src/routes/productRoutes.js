const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { getUploadConfig } = require('../config/upload');
const { validateProduct, handleValidationErrors } = require('../middlewares/validation');
const auth = require('../middlewares/auth');

// Obtener la configuración de upload (S3 o local)
const upload = getUploadConfig();

// Middleware para convertir strings numéricos a números (necesario cuando se usa FormData)
const convertNumericFields = (req, res, next) => {
  if (req.body) {
    // Convertir price a número si existe
    if (req.body.price !== undefined) {
      const priceNum = parseFloat(req.body.price);
      if (!isNaN(priceNum)) {
        req.body.price = priceNum;
      }
    }
    
    // Convertir pages a número entero si existe
    if (req.body.pages !== undefined) {
      const pagesNum = parseInt(req.body.pages, 10);
      if (!isNaN(pagesNum)) {
        req.body.pages = pagesNum;
      }
    }
    
    console.log('[convertNumericFields] Campos convertidos:', {
      price: { original: req.body.price, type: typeof req.body.price },
      pages: { original: req.body.pages, type: typeof req.body.pages }
    });
  }
  next();
};

// Crear producto (solo admin)
router.post('/', auth, upload.single('image'), convertNumericFields, validateProduct, handleValidationErrors, productController.createProduct);

// Listar productos (público)
router.get('/', productController.getProducts);

// Listar todos los productos para el admin (sin límite)
router.get('/admin', auth, productController.getAllProductsForAdmin);

// Obtener producto por ID (público) - debe ir después de /admin para que no lo capture
router.get('/:id', productController.getProductById);

// Editar producto (solo admin)
router.put('/:id', auth, upload.single('image'), convertNumericFields, validateProduct, handleValidationErrors, productController.updateProduct);

// Eliminar producto (solo admin)
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router; 