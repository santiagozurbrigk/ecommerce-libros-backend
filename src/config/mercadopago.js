// IMPLEMENTACIÓN DE MERCADO PAGO - DESHABILITADA TEMPORALMENTE
/*
const mercadopago = require('mercadopago');

// Configurar Mercado Pago
const configureMercadoPago = () => {
  try {
    // Configurar credenciales
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    });
    
    console.log('✅ Mercado Pago configurado correctamente');
  } catch (error) {
    console.error('❌ Error al configurar Mercado Pago:', error.message);
  }
};

// Crear preferencia de pago
const createPaymentPreference = async (orderData) => {
  try {
    const preference = {
      items: orderData.products.map(item => ({
        title: item.product.name,
        unit_price: item.product.price,
        quantity: item.quantity,
        picture_url: item.product.image ? `${process.env.BACKEND_URL}${item.product.image}` : null
      })),
      back_urls: {
        success: `${process.env.FRONTEND_URL}/checkout/success`,
        failure: `${process.env.FRONTEND_URL}/checkout/failure`,
        pending: `${process.env.FRONTEND_URL}/checkout/pending`
      },
      auto_return: 'approved',
      external_reference: orderData.orderId,
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      statement_descriptor: 'IMPRENTA LOW COST',
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    const response = await mercadopago.preferences.create(preference);
    return response.body;
  } catch (error) {
    console.error('❌ Error al crear preferencia de pago:', error.message);
    throw error;
  }
};

// Procesar notificación webhook
const processWebhook = async (data) => {
  try {
    if (data.type === 'payment') {
      const payment = await mercadopago.payment.findById(data.data.id);
      return payment.body;
    }
    return null;
  } catch (error) {
    console.error('❌ Error al procesar webhook:', error.message);
    throw error;
  }
};

module.exports = {
  configureMercadoPago,
  createPaymentPreference,
  processWebhook
};
*/

// Placeholder para evitar errores de importación
const configureMercadoPago = () => {
  console.log('ℹ️  Mercado Pago deshabilitado temporalmente');
};

const createPaymentPreference = async () => {
  throw new Error('Mercado Pago no está configurado');
};

const processWebhook = async () => {
  throw new Error('Mercado Pago no está configurado');
};

module.exports = {
  configureMercadoPago,
  createPaymentPreference,
  processWebhook
}; 