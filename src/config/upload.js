const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento local (fallback)
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});

// Configuración común para ambos tipos de almacenamiento
const commonConfig = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
};

// Función para obtener la configuración de upload
function getUploadConfig() {
  // Verificar si las variables de AWS están configuradas
  if (process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY && 
      process.env.AWS_S3_BUCKET_NAME) {
    try {
      const { upload: s3Upload } = require('./s3');
      console.log('✅ Usando almacenamiento AWS S3');
      return s3Upload;
    } catch (error) {
      console.warn('⚠️  Error al cargar configuración S3, usando almacenamiento local:', error.message);
      return multer({ storage: localStorage, ...commonConfig });
    }
  } else {
    console.log('ℹ️  Usando almacenamiento local (AWS S3 no configurado)');
    return multer({ storage: localStorage, ...commonConfig });
  }
}

module.exports = { getUploadConfig }; 