# UAOS Social Narration Handoff

Status: BLOCKED_MANUAL_NARRATION
Tutorials: 140
Languages: 3
Expected audio assets: 420
Approved audio assets: 0

Per-language status:
- ar: MANUAL_RECORDING_REQUIRED (140 scripts ready)
- en: REVIEW_OR_IMPORT_REQUIRED (140 scripts ready)
- de-foundation: REVIEW_OR_IMPORT_REQUIRED (140 scripts ready)

Required checks:
- Record or import approved narration audio for each tutorial and language.
- Verify consent for every human voice before use.
- Check duration against captions and storyboard timings.
- Check clipping, silence, pronunciation and pacing.
- Keep cloud TTS and voice cloning disabled unless explicitly approved later.

Safe local commands:
- npm run academy:narration:status
- npm run academy:validate:all
- npm run academy:render:status
- npm run academy:handoff:readiness

Publication allowed: false
Real microphone capture performed: false
Real network actions performed: false
