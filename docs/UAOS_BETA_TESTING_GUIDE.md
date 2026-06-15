# UAOS Beta Testing Guide

Run these local checks before sharing a beta build:

1. `npm test`
2. `npm run check`
3. `npm run build`
4. `npm run routes:smoke`
5. `npm run e2e:beta`
6. `npm run accessibility:check`
7. `npm run performance:check`
8. `npm run windows:readiness`
9. `npm run rc:gate`

Manual tests still required: microphone recording, MIDI hardware, arranger hardware, Windows installer signing and legal/privacy approval.
