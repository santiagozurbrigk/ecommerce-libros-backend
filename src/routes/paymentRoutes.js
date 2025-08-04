// RUTAS DE PAGOS - DESHABILITADAS TEMPORALMENTE
/*
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

// Crear preferencia de pago (requiere autenticación)
router.post('/create-preference', auth, paymentController.createPayment);

// Webhook para notificaciones de Mercado Pago (sin autenticación)
router.get('/webhook', paymentController.webhook);

// Obtener estado del pago (requiere autenticación)
router.get('/status/:paymentId', auth, paymentController.getPaymentStatus);

module.exports = router;
*/

// Placeholder para evitar errores de importación
const express = require('express');
const router = express.Router();

router.all('*', (req, res) => {
  res.status(501).json({ msg: 'Mercado Pago no está configurado' });
});

module.exports = router; 