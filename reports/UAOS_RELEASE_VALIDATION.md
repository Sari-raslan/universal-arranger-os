# UAOS Release Validation

## Local Validation
- JSON parse validation passed for 93 tracked JSON files outside ignored build/cache directories.
- UTF-8 BOM validation passed for tracked JSON files.
- Secret pattern scan on tracked files returned no matches.
- Tracked build/cache scan returned no `node_modules`, `dist`, Android build, or Gradle cache outputs after removing old tracked `landing-sales/dist` artifacts from the Git index.
- `npm run check` passed.
- `npm test` passed with 46 tests.
- `npm run build` passed.
- `npm run desktop:smoke` passed.
- Backend smoke passed: 1 library item and 12 supported extensions.
- In-app browser verification passed for `#/home`, `#/pro`, `#/midi`, `#/ai`, `#/status`, and `#/pricing`.

## Release Status
- `/api/status` exposes `available`, `experimental`, `planned`, and `not-included` states.
- Browser secure context, MediaDevices, Web Audio, MediaRecorder, Web MIDI, local storage, and Electron bridge are represented in the UI status surface.

## Manual Hardware Gates
- Microphone permission and feedback behavior must be verified with a real input device.
- MIDI reconnect, All Notes Off delivery, and profile mappings must be verified with actual KORG, Yamaha, Roland, or Ketron hardware.
- Signed desktop/mobile installers require platform signing credentials.
