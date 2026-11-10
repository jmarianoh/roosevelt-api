# AGENTS.md — roosevelt-api

Backend del sistema de tesorería del Edificio Roosevelt. Fastify 5, `node:sqlite` y TypeScript ejecutado con `tsx`. El frontend está en el repo hermano [roosevelt-app](https://github.com/jmarianoh/roosevelt-app), y sus tipos de respuesta están en `src/types/api.ts`.

## Comandos

```sh
npm ci            # instalar dependencias (Node.js 22 o posterior)
npm run dev       # modo watch en http://127.0.0.1:3001
npm start         # ejecución normal
npm run check     # verificación de tipos
```

No hay tests automatizados ni linter. Antes de dar un cambio por terminado, ejecuta `npm run check` y prueba las rutas afectadas con la API levantada.

## Estructura

Todo el servidor está en `server/index.ts`: esquema, importadores, autenticación y rutas. Las líneas son muy largas, así que busca por el nombre de la ruta o la función en vez de leer el archivo completo.

## Variables de entorno

- `HOST`: por defecto `127.0.0.1`. La imagen Docker usa `0.0.0.0`.
- `PORT`: por defecto `3001`.
- `ALLOWED_ORIGIN`: orígenes permitidos, separados por comas. Por defecto, los de Vite en local.
- `COOKIE_SECURE`: pon `true` en producción tras HTTPS para marcar la cookie de sesión como `Secure`. Por defecto no lo es.

## Datos: reglas estrictas

- Este repo no incluye datos financieros. Nunca subas `.local-data/`, `Cartolas*/`, `egresos/`, bases `*.sqlite`, respaldos ni archivos `.env`.
- `.local-data/` guarda la base `roosevelt.sqlite` y los documentos originales en `private/`. Su ubicación se calcula desde la raíz del proyecto.
- Prueba siempre con una copia del repo en otra carpeta y otro `PORT`, para que use su propia `.local-data/` vacía. No uses la base local real para pruebas que escriban datos.
- Si existen `Cartolas 2025-2026/` y `egresos/Egreso 61 Roosevelt.pdf` junto a `server/`, una base sin documentos se siembra con ellos al iniciar.

## Puntos delicados

- El esquema se crea con `CREATE TABLE IF NOT EXISTS` y no hay migraciones. Cambiar una definición no modifica las bases existentes, así que un cambio de esquema necesita un `ALTER TABLE` explícito y compatible con los datos actuales y con la restauración de respaldos.
- `POST /api/backup/restore` reemplaza los datos,.
- Los montos son enteros en pesos chilenos. No uses decimales.
- Los documentos se deduplican por `sha256`.
- Las cartolas se reconocen por el nombre del archivo: `Mes AAAA.xls` o `.xlsx`, por ejemplo `Octubre 2026.xls`.
- Límites: cuerpo de 30 MB, y 25 MB por archivo con un máximo de 30 archivos.
- Fastify responde 400 a una petición `application/json` sin cuerpo. El cliente no debe enviar ese encabezado en los POST vacíos.

## Autenticación y rutas nuevas

- La sesión va en la cookie `roosevelt_session`, y en la base solo se guarda el hash del token. Las contraseñas usan `scrypt` con sal.
- Rol único: `comite` (el esquema aún acepta `tesorero` por el CHECK, pero se normaliza a `comite` al iniciar).
- Las únicas rutas públicas son `/api/session`, `/api/bootstrap`, `/api/login` y `/api/health`. Toda ruta nueva lleva `{ preHandler: requireUser }`.
- Las operaciones reservadas comprueban `req.user.role` y responden 403.
- Registra las acciones que cambian datos con `audit()`, que alimenta la página Actividad.
- Los errores se responden como `{ error: 'mensaje en español' }`, porque el frontend muestra ese texto al usuario.
- Si cambias la forma de una respuesta, actualiza también `src/types/api.ts` en `roosevelt-app`.

## Despliegue

El `Dockerfile` ejecuta la API con el usuario `appuser` en Dokploy. `/app/.local-data` es un volumen y ahí persisten todos los datos. El healthcheck usa `/api/health`.
