# Configuración de AWS S3 para el proyecto

## Variables de entorno necesarias

Agrega estas variables a tu archivo `.env` del backend:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=tu_access_key_id_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_access_key_aqui
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=tu_bucket_name_aqui
```

## Pasos para configurar AWS S3

1. **Crear un bucket en S3:**
   - Ve a AWS S3 Console
   - Crea un nuevo bucket
   - Configura el bucket para acceso público (si es necesario)
   - Habilita CORS si es necesario

2. **Crear un usuario IAM:**
   - Ve a AWS IAM Console
   - Crea un nuevo usuario
   - Asigna la política `AmazonS3FullAccess` o una política personalizada más restrictiva
   - Genera las credenciales de acceso

3. **Configurar CORS en el bucket (opcional):**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Configuración del bucket

- **Nombre del bucket:** Debe ser único globalmente
- **Región:** Usa la misma región que especifiques en AWS_REGION
- **Permisos:** Configura para acceso público si las imágenes deben ser accesibles públicamente

## Notas importantes

- Las imágenes se almacenarán en la carpeta `productos/` dentro del bucket
- El tamaño máximo de archivo es 5MB
- Solo se permiten archivos de imagen (jpg, png, gif, etc.)
- Las URLs generadas serán públicas y accesibles directamente 