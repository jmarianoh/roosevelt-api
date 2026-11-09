# Roosevelt · Tesorería — API

Backend (Fastify + SQLite nativo de Node) del sistema de tesorería del Edificio Roosevelt. El frontend está en [roosevelt-app](https://github.com/jmarianoh/roosevelt-app).

## Desarrollo

Node.js 22 o posterior (usa `node:sqlite`).

```sh
npm install
npm run dev
```

Escucha en http://127.0.0.1:3001. El primer inicio de la app pide crear la cuenta de tesorero.

## Datos

La base SQLite y los documentos privados se guardan en `.local-data/` (ignorada por git). **Este repo no incluye datos financieros**: cartolas, PDF de egresos y respaldos nunca deben subirse.

Si existen las carpetas `Cartolas 2025-2026/` y `egresos/` (con `Egreso 61 Roosevelt.pdf`) junto a `server/`, la base vacía se siembra con ellas al iniciar. Si no existen, arranca vacía y los documentos se cargan desde la app.

Respaldo y restauración: **Ajustes → Descargar respaldo** (ZIP con datos, documentos y usuarios).

## Scripts

- `npm run dev` — modo watch
- `npm start` — ejecución normal
- `npm run check` — verificación de tipos
