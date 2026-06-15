# UAOS SOCIAL NARRATION

Narration is local-review metadata until real audio is recorded, imported and approved.

Safe narration flow:
1. Run `npm run academy:narration:status` to regenerate narration readiness reports.
2. Review `reports/UAOS_SOCIAL_NARRATION_HANDOFF.md` and the per-tutorial script files.
3. Record or import audio only with explicit voice consent.
4. Check duration, clipping, silence, pronunciation and pacing before rendering.
5. Keep cloud TTS and voice cloning disabled unless explicitly approved later.

The command never records microphone audio, uploads files, stores OAuth tokens or performs network actions.
