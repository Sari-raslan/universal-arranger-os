# UAOS Relaxed Product Mode Policy

Status: ACTIVE

## New Default

Agents prewrite files. Code X acts as final integrator. App, React, UI, and local build work are allowed when requested. Push and deploy are allowed only when explicitly requested. KORG writer and real KORG export remain blocked.

## Allowed When Requested

- App.jsx changes
- React integration
- frontend UI integration
- local app build
- product UI
- final owner program integration
- dashboards integrated into app
- Git commit
- Git push only if explicitly requested
- Vercel/GitHub Pages deploy only if explicitly requested

## Still Blocked

- KORG Writer implementation
- binary KORG writer
- real .STY generation
- real .SET generation
- .PRS generation
- .PRF generation
- .KST generation
- USB write
- package copy to USB
- PA3X load
- claim "PA3X-ready"
- claim "KORG-compatible"
- claim real KORG export works

## Allowed Generic UAOS Outputs

- .uaosstyle.json
- .style.json
- .mid
- .zip
- .json
- .html
- .md
- React/UI files when requested
