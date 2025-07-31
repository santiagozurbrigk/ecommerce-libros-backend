const Product = require('../models/Product');

// Crear producto
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, pages, category } = req.body;
    
    // Determinar la URL de la imagen según el tipo de almacenamiento
    let image = '';
    if (req.file) {
      // Si req.file.location existe, es S3; si no, es almacenamiento local
      image = req.file.location || `/uploads/${req.file.filename}`;
    }
    
    const product = new Product({ name, description, price, pages, category, image });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(400).json({ msg: 'No se pudo crear el producto. Verifica los datos e intenta nuevamente.' });
  }
};

// Listar productos
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter).skip(skip).limit(limit);
    res.json({ products, total });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ msg: 'No se pudieron obtener los productos. Intenta nuevamente o contacta soporte.' });
  }
};

// Eliminar producto
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ msg: 'Error al eliminar producto', error });
  }
};

// Editar producto
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, pages, category } = req.body;
    const update = { name, description, price, pages, category };
    
    // Determinar la URL de la imagen según el tipo de almacenamiento
    if (req.file) {
      // Si req.file.location existe, es S3; si no, es almacenamiento local
      update.image = req.file.location || `/uploads/${req.file.filename}`;
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(product);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(400).json({ msg: 'No se pudo actualizar el producto. Verifica los datos e intenta nuevamente.' });
  }
}; 