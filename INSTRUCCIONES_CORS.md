# ✅ CORS Actualizado - Instrucciones para Desplegar

## Cambios Realizados

Se actualizó la configuración de CORS en `src/index.js` para permitir:

1. ✅ Dominio anterior: `https://navajowhite-giraffe-485297.hostingersite.com`
2. ✅ Nuevo dominio de Vercel: `https://frontend-libros-two.vercel.app`
3. ✅ Todos los subdominios de Vercel: `*.vercel.app` (para preview deployments)
4. ✅ Desarrollo local: `http://localhost:5173` y `http://localhost:3000`

## Pasos para Desplegar

### 1. Verificar los cambios

```bash
cd backend-temp
git diff src/index.js
```

### 2. Hacer commit de los cambios

```bash
git add src/index.js
git commit -m "Actualizar CORS para permitir dominio de Vercel"
```

### 3. Hacer push al repositorio

```bash
git push origin main
```

### 4. Render se actualizará automáticamente

- Render detectará el push automáticamente
- Iniciará un nuevo deployment
- Espera 1-2 minutos para que termine

### 5. Verificar que funcione

- Abre tu frontend en Vercel: `https://frontend-libros-two.vercel.app`
- Intenta hacer login o cualquier acción
- No deberías ver errores de CORS en la consola

## Nota Importante

Si tu dominio de Vercel cambia (por ejemplo, con cada preview deployment), la configuración actual permitirá automáticamente cualquier subdominio `*.vercel.app`, así que no necesitarás actualizar el backend cada vez.

## Verificación

Para verificar que CORS está funcionando correctamente:

1. Abre la consola del navegador en tu frontend
2. Intenta hacer una petición al backend
3. Deberías ver en los logs del backend (en Render) el origin permitido
4. No deberías ver errores de CORS en la consola del navegador

