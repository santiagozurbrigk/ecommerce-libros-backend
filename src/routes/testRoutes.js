const express = require('express');
const router = express.Router();
const { getUploadConfig } = require('../config/upload');

// Obtener la configuración de upload
const upload = getUploadConfig();

// Endpoint para probar la configuración de upload
router.post('/test-upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const fileInfo = {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      storageType: req.file.location ? 'S3' : 'Local',
      url: req.file.location || `/uploads/${req.file.filename}`
    };

    res.json({
      message: 'Archivo subido exitosamente',
      file: fileInfo,
      config: {
        awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME),
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        bucketName: process.env.AWS_S3_BUCKET_NAME
      }
    });
  } catch (error) {
    console.error('Error en test upload:', error);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
});

// Endpoint para verificar la configuración
router.get('/config', (req, res) => {
  res.json({
    awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME),
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    storageType: (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME) ? 'S3' : 'Local'
  });
});

module.exports = router; 