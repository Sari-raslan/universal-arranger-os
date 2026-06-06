# Verified Run Commands

These commands were checked from the repository root.

```powershell
npm run build
npm run build --prefix frontend
npm run frontend:build
```

The frontend production build completes successfully. Vite reports a chunk-size warning for the main JavaScript bundle, but the build exits successfully.

Long-running runtime commands now available:

```powershell
npm run frontend:dev
npm run backend:dev
npm run desktop:dev
npm run desktop:start
```

Notes:
- `backend:dev` delegates to `npm run dev --prefix backend`.
- `backend/package.json` now exposes `dev` as `node src/server.js`.
- `desktop:dev` launches Electron via `electron .`.
