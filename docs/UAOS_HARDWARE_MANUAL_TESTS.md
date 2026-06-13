# UAOS Hardware Manual Tests

## Microphone
- Verify the app requests microphone permission only after user action.
- Confirm monitoring does not route microphone input directly to speakers by default.
- Stop capture and confirm MediaStream tracks and AudioContext resources are released.

## MIDI
- Connect each target device: KORG PA3X, KORG PA5X, Yamaha Genos, Roland BK9, and Ketron SD9.
- Verify input detection, output detection, reconnect behavior, and profile selection.
- Trigger Panic / All Notes Off and confirm stuck notes stop on all channels.
- Validate mappings against real device manuals and user expectations.

## Release
- Confirm `#/status`, `/api/status`, `#/pro`, `#/midi`, `#/ai`, and `#/pricing` return the expected UI after production deployment.
- Signed installers and store submissions require platform credentials and cannot be completed by local automation alone.
