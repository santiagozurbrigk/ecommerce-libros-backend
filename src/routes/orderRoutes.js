const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');

// Crear pedido
router.post('/', orderController.createOrder);

// Listar pedidos
router.get('/', orderController.getOrders);

// Listar pedidos del usuario autenticado
router.get('/mis-pedidos', auth, orderController.getMyOrders);

// Estadísticas de pedidos
router.get('/estadisticas', orderController.getOrderStats);

// Actualizar estado del pedido
router.put('/:id/status', orderController.updateOrderStatus);

// Ventas por mes
router.get('/dashboard/ventas-mes', orderController.getSalesByMonth);
// Productos más vendidos
router.get('/dashboard/top-productos', orderController.getTopProducts);

module.exports = router; 