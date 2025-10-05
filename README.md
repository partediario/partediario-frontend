# ParteDiario Frontend

Este proyecto contiene el frontend de la aplicación ParteDiario, construido con Next.js y preparado para ser ejecutado en contenedores Docker.

## Ejecución con Docker

A continuación se detallan los pasos para configurar y ejecutar la aplicación en entornos de desarrollo y producción utilizando Docker.

### Prerrequisitos

-   [Docker](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.

### 1. Configuración del Entorno

Antes de construir los contenedores, es necesario configurar las variables de entorno.

1.  **Crear el archivo de entorno:**
    Cree un archivo llamado `.env` en la raíz del proyecto. Puede copiar el contenido de `.env.example` si existe, o usar la siguiente plantilla:

    ```env
    # Variables de entorno para Docker
    NEXT_PUBLIC_SUPABASE_URL=SU_URL_PUBLICA_DE_SUPABASE
    NEXT_PUBLIC_SUPABASE_ANON_KEY=SU_LLAVE_ANONIMA_PUBLICA
    SUPABASE_SERVICE_ROLE_KEY=SU_LLAVE_SECRETA_DE_SERVICIO
    NEXT_PUBLIC_API_URL=http://localhost:3000
    ```

2.  **Completar los valores:**
    Reemplace los valores de placeholder (`SU_...`) con sus credenciales reales de Supabase.

### 2. Entorno de Desarrollo (Local)

Este entorno está configurado con **hot-reload**, lo que significa que cualquier cambio en el código fuente se reflejará automáticamente en el navegador sin necesidad de reconstruir la imagen.

**Para iniciar:**
Ejecute el siguiente comando en la raíz del proyecto:
```bash
docker compose -f docker-compose.dev.yml up --build -d
```

**Para detener:**
```bash
docker compose -f docker-compose.dev.yml down
```

Una vez iniciado, la aplicación estará disponible en `http://localhost:3000`.

### 3. Entorno de Producción

Este entorno construye una imagen optimizada, ligera y segura, lista para ser desplegada.

**Para iniciar:**
Ejecute el siguiente comando en la raíz del proyecto:
```bash
docker compose up --build -d
```

**Para detener:**
```bash
docker compose down
```

La aplicación también estará disponible en `http://localhost:3000`.
