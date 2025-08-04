#!/usr/bin/env node

/**
 * Health Check Script para Render.com
 * 
 * Este script verifica que la aplicación esté funcionando correctamente.
 * Render.com lo ejecutará periódicamente para verificar la salud del servicio.
 */

const http = require('http');
const https = require('https');

// Configuración
const PORT = process.env.PORT || 5000;
const HOST = 'localhost';
const TIMEOUT = 5000; // 5 segundos

// Función para hacer health check
function healthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/test',
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Health-Check/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.message) {
            console.log('✅ Health check exitoso:', response.message);
            resolve(true);
          } else {
            console.error('❌ Health check falló: Respuesta inválida');
            reject(new Error('Respuesta inválida'));
          }
        } catch (error) {
          console.error('❌ Health check falló: Error parseando JSON');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Health check falló:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ Health check falló: Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Ejecutar health check
if (require.main === module) {
  healthCheck()
    .then(() => {
      console.log('🎉 Aplicación funcionando correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Aplicación no responde:', error.message);
      process.exit(1);
    });
}

module.exports = { healthCheck }; 