const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    unique: true,
    required: false, // Se asignará automáticamente en el pre-save hook
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    }
  ],
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pendiente', 'en proceso', 'listo para retirar', 'entregado'],
    default: 'pendiente',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook para generar orderNumber automáticamente
orderSchema.pre('save', async function(next) {
  // Solo generar orderNumber si no existe (siempre para nuevos documentos)
  if (!this.orderNumber) {
    try {
      console.log('Generando orderNumber para nuevo pedido...');
      // Encontrar el número más alto existente usando una consulta más simple
      const lastOrder = await this.constructor.findOne({ orderNumber: { $exists: true, $ne: null } }).sort({ orderNumber: -1 }).limit(1);
      console.log('Último pedido encontrado:', lastOrder ? `orderNumber: ${lastOrder.orderNumber}` : 'ninguno');
      
      // Si no hay pedidos, empezar desde 1000, sino incrementar en 1
      if (lastOrder && lastOrder.orderNumber) {
        this.orderNumber = lastOrder.orderNumber + 1;
      } else {
        this.orderNumber = 1000;
      }
      console.log('OrderNumber asignado:', this.orderNumber);
    } catch (error) {
      console.error('Error al generar orderNumber:', error);
      // Si hay error, usar timestamp como fallback (últimos 6 dígitos)
      this.orderNumber = parseInt(String(Date.now()).slice(-6));
      console.log('OrderNumber fallback asignado:', this.orderNumber);
    }
  } else {
    console.log('OrderNumber ya existe:', this.orderNumber);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema); 