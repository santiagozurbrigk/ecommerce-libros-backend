const Order = require('../models/Order');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configuración de nodemailer con SMTP de Brevo
let transporter = null;

// Solo crear el transporter si las variables de entorno están configuradas
if (process.env.BREVO_USER && process.env.BREVO_API_KEY) {
  transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_API_KEY,
    },
  });
}

// Crear pedido
exports.createOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    // Enviar email de confirmación solo si el transporter está configurado
    const userEmail = req.body.email || (req.user && req.user.email);
    if (userEmail && transporter) {
      const mailOptions = {
        from: process.env.BREVO_USER,
        to: userEmail,
        subject: 'Confirmación de pedido - Impresiones Low Cost',
        html: `<h2>¡Gracias por tu pedido!</h2>
          <p>Hemos recibido tu pedido y lo estamos procesando.</p>
          <p><b>Total:</b> $${order.total}</p>
          <p><b>ID de pedido:</b> #${order._id.toString().slice(-4)}</p>
          <p>Te avisaremos cuando esté listo para retirar.</p>
          <p>Si tienes dudas, responde a este email.</p>`
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error enviando email:', err);
      });
    }
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: 'No se pudo crear el pedido. Verifica los datos e intenta nuevamente. Si el problema persiste, contacta soporte.' });
  }
};

// Listar pedidos
exports.getOrders = async (req, res) => {
  try {
    const filter = {};
    
    // Filtro por usuario específico
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    
    // Filtro por búsqueda
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      
      // Buscar por ID de pedido (últimos 4 dígitos)
      if (searchTerm.length <= 4 && /^\d+$/.test(searchTerm)) {
        // Buscar por los últimos dígitos del ID
        const orders = await Order.find()
          .populate('user', 'nombre email telefono')
          .populate('products.product', 'name price image')
          .sort({ createdAt: -1 });
        
        const filteredOrders = orders.filter(order => 
          order._id.toString().slice(-searchTerm.length) === searchTerm
        );
        return res.json(filteredOrders);
      }
      
      // Buscar por nombre, email o teléfono del usuario
      const users = await User.find({
        $or: [
          { nombre: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { telefono: { $regex: searchTerm, $options: 'i' } }
        ]
      });
      
      if (users.length > 0) {
        const userIds = users.map(user => user._id);
        filter.user = { $in: userIds };
      } else {
        // Si no se encontraron usuarios, devolver array vacío
        return res.json([]);
      }
    }
    
    const orders = await Order.find(filter)
      .populate('user', 'nombre email telefono')
      .populate('products.product', 'name price image')
      .sort({ createdAt: -1 }); // Ordenar por fecha descendente (más recientes primero)
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'No se pudieron obtener los pedidos. Intenta nuevamente o contacta soporte.' });
  }
};

// Actualizar estado del pedido
exports.updateOrderStatus = async (req, res) => {
  try {
    console.log('Actualizando estado del pedido:', req.params.id, 'a:', req.body.status);
    
    // Verificar que el pedido existe
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      console.error('Pedido no encontrado:', req.params.id);
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('user', 'nombre email');
    
    console.log('Pedido actualizado exitosamente:', order._id);
    
    // Enviar email solo si el estado es 'listo para retirar' y el transporter está configurado
    if (order.status === 'listo para retirar' && order.user?.email && transporter) {
      console.log('Enviando email de notificación a:', order.user.email);
      
      const mailOptions = {
        from: process.env.BREVO_USER,
        to: order.user.email,
        subject: '¡Tu pedido está listo para retirar! - Impresiones Low Cost',
        html: `<h2>¡Tu pedido ya está listo para retirar!</h2>
          <p>Puedes pasar a buscarlo por el local cuando quieras.</p>
          <p><b>ID de pedido:</b> #${order._id.toString().slice(-4)}</p>
          <p>Si tienes dudas, responde a este email.</p>`
      };
      
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Error enviando email:', err);
        } else {
          console.log('Email enviado exitosamente:', info.messageId);
        }
      });
    } else {
      console.log('No se enviará email - Condiciones no cumplidas:', {
        status: order.status,
        hasEmail: !!order.user?.email,
        hasTransporter: !!transporter
      });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    res.status(500).json({ msg: 'Error al actualizar estado del pedido' });
  }
};

// Estadísticas de pedidos
exports.getOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allOrders = await Order.find();
    const totalFacturacion = allOrders.reduce((acc, o) => acc + o.total, 0);
    const pedidosPorEstado = allOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    const pedidosTotales = allOrders.length;

    const diaria = allOrders.filter(o => o.createdAt >= startOfDay).reduce((acc, o) => acc + o.total, 0);
    const semanal = allOrders.filter(o => o.createdAt >= startOfWeek).reduce((acc, o) => acc + o.total, 0);
    const mensual = allOrders.filter(o => o.createdAt >= startOfMonth).reduce((acc, o) => acc + o.total, 0);

    const recientes = await Order.find().sort({ createdAt: -1 }).limit(5)
      .populate('user', 'nombre email')
      .populate('products.product', 'name price image');

    res.json({
      totalFacturacion,
      diaria,
      semanal,
      mensual,
      pedidosTotales,
      pedidosPorEstado,
      recientes
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener estadísticas', error });
  }
};

// Ventas por mes (últimos 12 meses)
exports.getSalesByMonth = async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
      });
    }
    const sales = await Promise.all(
      months.map(async ({ year, month, label }) => {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);
        const orders = await Order.find({ createdAt: { $gte: start, $lt: end } });
        const total = orders.reduce((acc, o) => acc + o.total, 0);
        return { label, total };
      })
    );
    res.json(sales);
  } catch (error) {
    res.status(500).json({ msg: 'No se pudieron obtener las ventas por mes.' });
  }
};

// Productos más vendidos (top 5)
exports.getTopProducts = async (req, res) => {
  try {
    const orders = await Order.find().populate('products.product', 'name');
    const productMap = {};
    orders.forEach(order => {
      order.products.forEach(item => {
        const id = item.product?._id?.toString();
        if (!id) return;
        if (!productMap[id]) {
          productMap[id] = { name: item.product.name, count: 0 };
        }
        productMap[id].count += item.quantity;
      });
    });
    const top = Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    res.json(top);
  } catch (error) {
    res.status(500).json({ msg: 'No se pudieron obtener los productos más vendidos.' });
  }
};

// Obtener pedidos del usuario autenticado
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .populate('products.product', 'name price image');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener tus pedidos', error });
  }
}; 