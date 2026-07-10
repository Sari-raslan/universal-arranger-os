# UAOS Light Engine V10.1 Ambient Magic Pack

Status: AMBIENT_MAGIC_READY

## Completed

- Added `src/services/AmbientMagicEngine.js` with Candle, Fireplace, Lantern, Embers, Sunset, Romantic, Night, Sleep, Soft Clouds, and Oriental Lantern.
- Added native server endpoints for ambient list, run, stop, status, favorites save, favorites list, and favorites run.
- Added a V10 Ambient Magic dashboard with warm daily effects first, controls panel, favorites, Turn Off, and Emergency Stop.
- Added `src/config/ambient-favorites-v10.json` with default daily slots 1-9.
- Updated the local Light Engine entry tile to say `UAOS Light Engine V10 Ambient Magic`.
- Preserved V5 fallback, V10 routes, PC Edition structure, Hue token/config discovery, WLED gating, DMX gating, no deploy, and no payment.

## Safety

- Emergency Stop clears ambient motion before setting warm white 30%.
- Turn Off clears ambient motion before turning lights off.
- Ambient effects use slow Hue REST intervals and transition times.
- Hard brightness limit is 80%.
- Candle, Fireplace, Lantern, Night, and Sleep enforce their lower requested caps.

## Validation Notes

- JavaScript syntax checks passed for the server, ambient engine, and V10 UI script.
- `npm run build` and `npm run smoke-test` were run after implementation.
- Physical Hue observation requires the owner/light room; software paths are wired to existing real Hue `setLight` logic.
