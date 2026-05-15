# 🛡️ Shield Rate-Limit API

**Shield** es una infraestructura de Rate Limiting de alto rendimiento diseñada para proteger microservicios y APIs externas. Permite gestionar cuotas de tráfico dinámicas, monitorizar el consumo en tiempo real y asegurar la escalabilidad de tus servicios mediante una arquitectura desacoplada basada en Redis y PostgreSQL.

---

## 🚀 Funcionalidades Principales

### 🔑 Gestión de API Keys Profesional
- **Multi-tenancy:** Las llaves están vinculadas a usuarios/organizaciones.
- **Seguridad Superior:** Almacenamiento de llaves mediante hashing (SHA-256). Nunca guardamos la llave real.
- **Prefijos de Identificación:** Visualización segura de llaves en el dashboard (ej: `rl_live_...`).
- **CRUD Completo:** Creación, edición de límites y revocación instantánea.

### ⚡ Rate Limiting de Alto Rendimiento
- **Límites Dinámicos:** Configura límites de peticiones y ventanas de tiempo específicos para cada API Key.
- **Caché Distribuido:** Validación de cuotas mediante Redis para una latencia ultra baja.
- **Sliding Window Algorithm:** Implementación precisa del algoritmo de ventana deslizante.

### 📊 Analíticas e Insights
- **Logs de Uso:** Registro detallado de cada petición (éxitos y bloqueos).
- **Endpoints de Dashboard:** Datos listos para gráficas (Top endpoints, desglose de errores 429, historial de uso).

### 🛡️ Seguridad Administrativa
- **Autenticación JWT:** Dashboard protegido para la gestión de usuarios y llaves.
- **Protección contra Fuerza Bruta:** Rate limiting interno (Throttler) en rutas de login y registro.
- **Helmet:** Implementación de cabeceras de seguridad HTTP de grado industrial.

---

## 🛠️ Stack Tecnológico

- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) con [Prisma ORM](https://www.prisma.io/)
- **Caché y Mensajería:** [Redis](https://redis.io/) (ioredis)
- **Seguridad:** Passport JWT, Bcrypt, Helmet
- **Documentación:** Swagger (OpenAPI 3.0)
- **Observabilidad:** NestJS Terminus (Health Checks) & Winston (Structured Logging)

---

## 📦 Instalación y Setup

### 1. Requisitos previos
- Node.js (v18+)
- Docker y Docker Compose

### 2. Configuración
Asegúrate de configurar tus variables de entorno en el archivo `.env`:
- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`

### 3. Levantar Infraestructura (DB & Redis)
```bash
docker-compose up -d
```

### 4. Inicializar Base de Datos
```bash
npx prisma migrate dev
```

### 5. Iniciar la Aplicación
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

---

## 📖 Documentación de la API

Una vez que la aplicación esté corriendo, puedes acceder a la documentación interactiva completa en:

👉 [http://localhost:3000/docs](http://localhost:3000/docs)

Aquí podrás probar todos los flujos de autenticación, gestión de llaves y analíticas.

---

## 🩺 Monitoreo de Salud

La API expone un endpoint de salud para sistemas de orquestación (Kubernetes/AWS):
- **URL:** `GET /health`
- **Verifica:** Conexión a PostgreSQL y estado del servicio.

---

## 🎥 Video

https://github.com/user-attachments/assets/8dc01ab5-c3e7-4cb1-b580-eb4405fff4f7

## 🗺️ RoadMap
- [ ] Implementar SDK para Node.js y Python.
- [ ] Soporte para Webhooks al alcanzar el 80% de la cuota.
- [ ] Exportación de analíticas a CSV/PDF.
