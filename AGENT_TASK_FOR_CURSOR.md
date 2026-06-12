UAOS TEAM EXECUTION PLAN

Main Agent:
Cursor

Support:
VS Code for review/manual fixes
Android Studio for APK/emulator/signing
PowerShell for build/deploy/checkup
Vercel for production deploy
GitHub CLI/Git for version control

Cursor task:
Continue UAOS automatically.

Rules:
1. Inspect repo first.
2. Continue from current public live version.
3. Do not commit generated binaries or desktop/mobile build artifacts.
4. Work in small commits.
5. After each change run:
   npm run build --prefix uaos-live-clean
6. Then check:
   https://universal-arranger-os.vercel.app
   /api/status
7. Keep desktop, Android, and web synced.
8. Write reports into agent-output.
9. Stop only for blocking errors.

Next priorities:
1. Real WAV sampler playback.
2. MIDI/WebMIDI input verification.
3. Style timeline editor improvements.
4. Desktop app launch fix.
5. Android app touch UI polish.
6. Release QA report.
