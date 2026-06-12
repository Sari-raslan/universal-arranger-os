# UAOS V1 Manual Test Plan

## Browser

1. Run `npm run setup` if dependencies are missing.
2. Run `npm run build`.
3. Run `npm run dev --prefix uaos-live-clean`.
4. Open `http://127.0.0.1:5173`.
5. Visit each route: `home`, `sing`, `studio`, `pro`, `midi`, `sounds`, `sampler`, `promo`, `pricing`, `downloads`, `audio`, `timeline`, `arranger`, `live`, `sessions`, `diagnostics`.

## Audio

1. Open `#/audio`.
2. Select the desired microphone if the browser exposes input labels.
3. Start microphone and verify RMS/peak meters respond to real input.
4. Suspend, resume, and stop.
5. Confirm browser capture indicator turns off after stop.
6. Record a short clip, stop, and download it.
7. Verify the downloaded extension matches the browser-supported MIME type and is not mislabeled as WAV.

## MIDI

1. Open `#/midi` in a WebMIDI-capable browser or UAOS Desktop.
2. Scan devices.
3. Select input and output.
4. Play notes and move controllers; verify monitor messages show note on/off, CC, program change, pitch bend where supported.
5. Enable MIDI thru only with a safe output selected.
6. Use MIDI learn buttons and confirm mappings persist after refresh.
7. Press Panic and verify connected hardware receives All Notes Off.

## Timeline And Sessions

1. Open `#/timeline`.
2. Start recording, create MIDI and audio-analysis events, then stop.
3. Verify event count remains bounded and audio-analysis does not record every animation frame.
4. Open `#/sessions`; save, load, export JSON, clear local state, and import the exported JSON.
5. Try importing invalid JSON and verify a visible error.

## Arranger And Live Mode

1. Open `#/arranger`.
2. Start transport, switch sections, change BPM and chord.
3. Toggle mute/solo per lane, change pattern selection, and save/recall a scene.
4. Open `#/live`; verify large performance controls remain usable.
5. Press Panic.

## Desktop

1. Run `npm run build`.
2. Run `npm run desktop:smoke`.
3. Start desktop with `npm run desktop` where Electron dependencies are installed.
4. Confirm renderer has no Node integration and loads local dist or localhost dev URL, not production Vercel.
