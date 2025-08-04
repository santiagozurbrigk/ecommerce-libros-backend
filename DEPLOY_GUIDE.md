# 🚀 Guía de Deploy - Render.com

## 📋 Configuración Actual

### **✅ Servicios Configurados**
- **Backend**: Render.com (Free Plan)
- **Base de datos**: MongoDB Atlas (Free Plan)
- **Frontend**: Hostinger (Próximamente Vercel)

## 🔧 Configuración en Render.com

### **1. Variables de Entorno Requeridas**
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database
JWT_SECRET=tu_jwt_secret_super_seguro
```

### **2. Variables de Entorno Opcionales**
```env
# AWS S3 (para almacenamiento de imágenes)
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET_NAME=tu_bucket_name

# Email (Brevo/Sendinblue)
BREVO_USER=tu_email
BREVO_API_KEY=tu_api_key
```

### **3. Configuración del Servicio**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/test`

## 🏥 Health Check

### **Endpoint de Health Check**
```
GET /api/test
```

**Respuesta esperada:**
```json
{
  "message": "Backend funcionando correctamente",
  "timestamp": "2025-08-04T17:40:29.119Z",
  "cors": "Configurado correctamente",
  "security": "Medidas de seguridad implementadas"
}
```

### **Script de Health Check**
```bash
npm run health-check
```

## 📊 Monitoreo

### **Logs en Render.com**
- **Build Logs**: Ver logs del proceso de build
- **Runtime Logs**: Ver logs de la aplicación en tiempo real
- **Health Check Logs**: Ver logs de los health checks

### **Métricas a Monitorear**
1. **Tiempo de respuesta** de `/api/test`
2. **Uso de memoria** del servidor
3. **Tiempo de cold start** después del sleep mode
4. **Errores** en los logs

## 🔍 Troubleshooting

### **Problema: Error 404 en ruta raíz**
**Solución**: ✅ **Resuelto** - Agregada ruta raíz con documentación de la API

### **Problema: Sleep mode lento**
**Síntomas**: Primer request después de 15 min de inactividad es lento
**Solución**: 
- Considerar plan pago de Render.com ($7/mes)
- Implementar keep-alive con cron job
- Usar Railway.app como alternativa

### **Problema: Error de CORS**
**Síntomas**: Errores de CORS en el frontend
**Solución**: Verificar que el dominio del frontend esté en `allowedOrigins`

### **Problema: Error de conexión a MongoDB**
**Síntomas**: Errores de conexión a la base de datos
**Solución**: 
- Verificar `MONGO_URI` en variables de entorno
- Verificar que la IP de Render.com esté en whitelist de MongoDB Atlas

## 🚀 Optimizaciones

### **1. Performance**
- ✅ **Compresión**: Habilitada con Express
- ✅ **Caching**: Headers de cache configurados
- ✅ **Rate Limiting**: Implementado para prevenir abuso

### **2. Seguridad**
- ✅ **Helmet**: Headers de seguridad
- ✅ **CORS**: Configurado correctamente
- ✅ **Rate Limiting**: Protección contra ataques
- ✅ **Input Validation**: Sanitización de datos

### **3. Logging**
- ✅ **Request Logging**: Todos los requests se registran
- ✅ **Error Logging**: Errores detallados con stack trace
- ✅ **Security Logging**: Actividad sospechosa detectada

## 📈 Escalabilidad

### **Cuándo considerar upgrade**
- **Usuarios**: > 1000 usuarios/mes
- **Tiempo de respuesta**: > 2 segundos
- **Errores**: > 5% de requests fallan
- **Memoria**: > 400 MB de uso

### **Opciones de upgrade**
1. **Render.com Paid Plan** ($7/mes)
   - Sin sleep mode
   - Más recursos
   - Base de datos incluida

2. **Railway.app** ($5/mes)
   - Sin sleep mode
   - Deploy automático
   - Muy confiable

3. **DigitalOcean** ($5/mes)
   - Control total
   - Sin límites
   - Muy escalable

## 🔄 Deploy Automático

### **Configuración Git**
- **Branch**: `main`
- **Auto Deploy**: Habilitado
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### **Proceso de Deploy**
1. Push a `main` branch
2. Render.com detecta cambios
3. Ejecuta `npm install`
4. Ejecuta `npm start`
5. Health check en `/api/test`
6. Servicio disponible

## 📞 Soporte

### **Logs de Error Comunes**
```
❌ Error: Ruta no encontrada: /
✅ Solución: Ruta raíz agregada con documentación

❌ Error: MongoDB connection failed
✅ Solución: Verificar MONGO_URI y whitelist

❌ Error: CORS policy
✅ Solución: Verificar allowedOrigins
```

### **Contacto**
- **Render.com Support**: Dashboard de Render.com
- **MongoDB Atlas Support**: Dashboard de MongoDB Atlas
- **Desarrollador**: Santiago Zurbrigk

---

**Última actualización**: 04/08/2025
**Versión**: 1.0.0
**Estado**: Producción 