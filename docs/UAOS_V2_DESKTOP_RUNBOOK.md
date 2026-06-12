# UAOS V2 Desktop Runbook

1. Run `npm run setup`.
2. Run `npm run build`.
3. Run `npm run desktop:smoke`.
4. Start Electron with `npm run desktop` where desktop dependencies are installed.
5. Validate offline behavior by disconnecting the network after a successful local build; the desktop entry should load local dist or localhost dev URL, never Vercel.
6. Validate project file save/load through the desktop project store adapter once the Electron file IPC adapter is wired for the target build.

Installer signing and final update delivery remain manual release work.

