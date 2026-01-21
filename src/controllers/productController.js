const Product = require('../models/Product');

// Crear producto
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, pages, category } = req.body;
    
    // Determinar la URL de la imagen según el tipo de almacenamiento
    let image = '';
    if (req.file) {
      // Si req.file.location existe, es S3 (multer-s3 con AWS SDK v2)
      // Si req.file.key existe pero no location, construir URL de S3 manualmente (AWS SDK v3)
      if (req.file.location) {
        image = req.file.location;
      } else if (req.file.key && process.env.AWS_S3_BUCKET_NAME) {
        // Construir URL de S3 manualmente para AWS SDK v3
        const region = process.env.AWS_REGION || 'us-east-1';
        const bucket = process.env.AWS_S3_BUCKET_NAME;
        image = `https://${bucket}.s3.${region}.amazonaws.com/${req.file.key}`;
      } else {
        // Almacenamiento local
        image = `/uploads/${req.file.filename}`;
      }
      
      console.log('📸 Imagen guardada:', {
        hasLocation: !!req.file.location,
        hasKey: !!req.file.key,
        location: req.file.location,
        key: req.file.key,
        filename: req.file.filename,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        finalImage: image,
        storageType: req.file.location || req.file.key ? 'S3' : 'Local',
        fileObject: JSON.stringify(req.file, null, 2)
      });
    } else {
      console.log('⚠️  No se recibió archivo de imagen para el producto:', name);
    }
    
    const product = new Product({ name, description, price, pages, category, image });
    await product.save();
    console.log('✅ Producto creado:', { id: product._id, name: product.name, image: product.image });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(400).json({ msg: 'No se pudo crear el producto. Verifica los datos e intenta nuevamente.' });
  }
};

// Listar productos (con paginación para el frontend)
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const filter = {};
    
    const hasCategory = req.query.category;
    const hasSearch = req.query.search && req.query.search.trim();
    
    // Si hay búsqueda Y categoría, usar $and explícitamente
    if (hasCategory && hasSearch) {
      const searchTerm = req.query.search.trim();
      filter.$and = [
        { category: req.query.category },
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ];
    } else {
      // Si solo hay categoría
      if (hasCategory) {
        filter.category = req.query.category;
      }
      
      // Si solo hay búsqueda
      if (hasSearch) {
        const searchTerm = req.query.search.trim();
        filter.$or = [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }
    }
    
    console.log('Query params:', { category: req.query.category, search: req.query.search, page, limit });
    console.log('Filter aplicado:', JSON.stringify(filter, null, 2));
    
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter).skip(skip).limit(limit);
    
    // Log para debug: verificar imágenes de productos
    products.forEach((product, index) => {
      console.log(`Producto ${index + 1}:`, {
        id: product._id,
        name: product.name,
        image: product.image || '(vacía)',
        hasImage: !!product.image,
        imageType: product.image ? (product.image.startsWith('http') ? 'URL completa' : 'Ruta relativa') : 'Sin imagen'
      });
    });
    
    console.log(`Encontrados ${total} productos, mostrando ${products.length} en página ${page}`);
    
    res.json({ products, total });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ msg: 'No se pudieron obtener los productos. Intenta nuevamente o contacta soporte.' });
  }
};

// Listar todos los productos para el admin (sin límite)
exports.getAllProductsForAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    console.error('Error al obtener productos para admin:', error);
    res.status(500).json({ msg: 'No se pudieron obtener los productos. Intenta nuevamente o contacta soporte.' });
  }
};

// Obtener producto por ID (público)
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ msg: 'Error al obtener el producto. Intenta nuevamente o contacta soporte.' });
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
      // Si req.file.location existe, es S3 (multer-s3 con AWS SDK v2)
      // Si req.file.key existe pero no location, construir URL de S3 manualmente (AWS SDK v3)
      if (req.file.location) {
        update.image = req.file.location;
      } else if (req.file.key && process.env.AWS_S3_BUCKET_NAME) {
        // Construir URL de S3 manualmente para AWS SDK v3
        const region = process.env.AWS_REGION || 'us-east-1';
        const bucket = process.env.AWS_S3_BUCKET_NAME;
        update.image = `https://${bucket}.s3.${region}.amazonaws.com/${req.file.key}`;
      } else {
        // Almacenamiento local
        update.image = `/uploads/${req.file.filename}`;
      }
      
      console.log('📸 Imagen actualizada:', {
        hasLocation: !!req.file.location,
        hasKey: !!req.file.key,
        location: req.file.location,
        key: req.file.key,
        filename: req.file.filename,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        finalImage: update.image,
        storageType: req.file.location || req.file.key ? 'S3' : 'Local',
        fileObject: JSON.stringify(req.file, null, 2)
      });
    } else {
      console.log('ℹ️  No se actualizó la imagen (mantiene la existente)');
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    console.log('✅ Producto actualizado:', { id: product._id, name: product.name, image: product.image });
    res.json(product);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(400).json({ msg: 'No se pudo actualizar el producto. Verifica los datos e intenta nuevamente.' });
  }
}; 