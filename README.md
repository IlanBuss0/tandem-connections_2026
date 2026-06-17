# TANDEM Connections 2026

Frontend React/Vite para TANDEM, una plataforma orientada a autonomia, accesibilidad, rutinas, actividades, chat y seguimiento entre usuarios, tutores y profesionales.

## Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui + Radix UI
- TanStack Query
- Socket.IO client

## Desarrollo

```bash
npm install
npm run dev
```

Por defecto el frontend espera el backend en `http://localhost:3000`.
Para cambiarlo, crear `.env`:

```bash
VITE_BACKEND_URL=http://localhost:3000
```

## Calidad

```bash
npm run lint
npm test
npm run build
```

El proyecto conserva algunos datos mock como soporte temporal para pantallas que todavia no estan completamente migradas al backend. La integracion nueva debe priorizar `src/services/api/client.ts` y `src/services/api/tandem-api.ts`.
