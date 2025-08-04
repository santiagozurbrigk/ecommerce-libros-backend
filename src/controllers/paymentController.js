const { createPaymentPreference, processWebhook } = require('../config/mercadopago');
const Order = require('../models/Order');

// Crear preferencia de pago
const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Buscar el pedido
    const order = await Order.findById(orderId)
      .populate('user', 'nombre email')
      .populate('products.product', 'name price image');
    
    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }

    // Verificar que el pedido pertenece al usuario autenticado
    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No tienes permisos para este pedido' });
    }

    // Preparar datos para Mercado Pago
    const orderData = {
      orderId: order._id.toString(),
      products: order.products.map(item => ({
        product: {
          name: item.product.name,
          price: item.product.price,
          image: item.product.image
        },
        quantity: item.quantity
      }))
    };

    // Crear preferencia de pago
    const preference = await createPaymentPreference(orderData);
    
    res.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point
    });

  } catch (error) {
    console.error('❌ Error al crear pago:', error);
    res.status(500).json({ msg: 'Error al procesar el pago' });
  }
};

// Webhook para recibir notificaciones de Mercado Pago
const webhook = async (req, res) => {
  try {
    const { type, data } = req.query;
    
    if (type === 'payment') {
      const payment = await processWebhook({ type, data });
      
      if (payment) {
        const orderId = payment.external_reference;
        const order = await Order.findById(orderId);
        
        if (order) {
          // Actualizar estado del pedido según el estado del pago
          let newStatus = 'pendiente';
          
          switch (payment.status) {
            case 'approved':
              newStatus = 'en proceso';
              break;
            case 'rejected':
              newStatus = 'cancelado';
              break;
            case 'pending':
              newStatus = 'pendiente';
              break;
            case 'in_process':
              newStatus = 'en proceso';
              break;
            default:
              newStatus = 'pendiente';
          }
          
          order.status = newStatus;
          order.paymentStatus = payment.status;
          order.paymentId = payment.id;
          await order.save();
          
          console.log(`✅ Pedido ${orderId} actualizado: ${newStatus}`);
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).send('Error');
  }
};

// Obtener estado del pago
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const mercadopago = require('mercadopago');
    const payment = await mercadopago.payment.findById(paymentId);
    
    res.json({
      success: true,
      status: payment.body.status,
      statusDetail: payment.body.status_detail
    });
  } catch (error) {
    console.error('❌ Error al obtener estado del pago:', error);
    res.status(500).json({ msg: 'Error al obtener estado del pago' });
  }
};

module.exports = {
  createPayment,
  webhook,
  getPaymentStatus
}; 