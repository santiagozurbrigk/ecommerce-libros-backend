const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }
    
    console.log('Intentando conectar a MongoDB...');
    console.log('URI:', process.env.MONGO_URI.substring(0, 50) + '...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado exitosamente');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('Detalles del error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
