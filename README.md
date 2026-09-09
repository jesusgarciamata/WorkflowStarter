# WorkflowStarter

Panel web privado para seleccionar y lanzar workflows mediante webhooks. La interfaz nunca recibe las URLs ni las credenciales de los webhooks: las llamadas se realizan desde el backend.

## Configuración

1. Crea el archivo local de variables de entorno:

   ```bash
   cp .env.example .env
   ```

2. Cambia los valores de contraseña en `.env`:

   ```dotenv
   DASHBOARD_USERNAME=admin
   DASHBOARD_PASSWORD=una-contraseña-segura

   WEBHOOK_USERNAME=PersonalStarter
   WEBHOOK_PASSWORD=la-contraseña-compartida-de-los-webhooks

   ASTRALSKETCH_WEBHOOK_URL=https://n8n.n8ngsus.uk/webhook/ee261d6d-1392-421a-a612-8ea1ffe1aaa6
   ASTRAL_GERMAN_WEBHOOK_URL=https://n8n.n8ngsus.uk/webhook/16f2e784-88fe-4290-99de-2e3f9027164e
   SOMOS_COSMOS_WEBHOOK_URL=https://n8n.n8ngsus.uk/webhook/d93ee5fd-6c3c-4b9c-973b-0faf7af62838
   SKETCH_DINERO_WEBHOOK_URL=https://n8n.n8ngsus.uk/webhook/7613febf-24a5-42e0-b0d8-582db13d059f
   ```

`DASHBOARD_USERNAME` es opcional y usa `admin` si se omite. `DASHBOARD_PASSWORD`, las credenciales compartidas `WEBHOOK_USERNAME` y `WEBHOOK_PASSWORD`, y la URL de cada workflow son obligatorias. `.env` está excluido de Git y del contexto de Docker.

## Ejecución con Docker Compose

```bash
docker compose up --build -d
```

Abre `http://localhost:3000`. El navegador solicitará el usuario y la contraseña del panel mediante HTTP Basic Auth.

En producción, publica el contenedor únicamente detrás de HTTPS. Basic Auth no cifra las credenciales por sí mismo; depende de TLS para protegerlas durante el transporte.

Para detener la aplicación:

```bash
docker compose down
```

## Desarrollo local

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

## Añadir otro workflow

Agrega una entrada en `lib/workflow-catalog.ts` con un `id`, un nombre y un `envPrefix`. Después añade la URL a `.env.example` y `.env` usando ese prefijo:

```dotenv
PREFIJO_WEBHOOK_URL=https://example.com/webhook
```

Todos los workflows reutilizan `WEBHOOK_USERNAME` y `WEBHOOK_PASSWORD`.

El backend acepta como máximo 20 workflows por lanzamiento, elimina identificadores duplicados y aplica un tiempo límite de 30 segundos a cada webhook.
