# IMPL-027 Improvement Plan For Owner Neutral 002

LOCAL ONLY - PLANNING ONLY - NO REAL KEYBOARD OUTPUT

## Goal

Plan a better owner-test neutral package for IMPL-028 while keeping output limited to `.uaos-neutral.json` and metadata-only content.

## Proposed Improvements

### Clearer Musical Section Naming

Use more descriptive section names:

- Intro - soft entry
- Verse A - main groove
- Chorus - lifted phrase
- Break - short transition
- Ending - safe close

### Safer Owner Notes

Replace broad notes with explicit local-only language:

- Owner review metadata only.
- Not keyboard-native.
- Not public release.
- Real compatibility unverified.
- No samples or proprietary content.

### Better Metadata Fields

Add optional metadata fields:

- `style_intent`
- `tempo_range`
- `key_center`
- `time_signature`
- `mood`
- `arrangement_notes`
- `owner_review_notes`

### Future Chord / Style Metadata Placeholders

Add metadata-only placeholders:

- `chord_map`
- `section_chords`
- `style_family_hint`
- `groove_intent`
- `variation_notes`

These must remain descriptive metadata only and must not include copied style data or keyboard-native payloads.

### Future Validation Fields

Add validation fields:

- `validated_extension_is_neutral`
- `validated_no_keyboard_native_payload`
- `validated_no_audio_samples`
- `validated_no_proprietary_libraries`
- `validated_no_public_release_claim`
- `validated_no_payment_claim`

## Explicit Blocks

- No audio/sample inclusion.
- No proprietary library content.
- No Kontakt/Native Instruments content.
- No keyboard-native extension.
- No `.SET` or `.STY` output.
- No `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` output.
- No public release, deploy, Vercel, or payment.

## Next Stage

IMPL-028 owner-neutral-002 dry-run package revision.

## Success Criteria For IMPL-028

- Output remains `.uaos-neutral.json`.
- Musical content remains metadata-only.
- Manifest, checksum, validation, README, and backup are created.
- Writer sandbox checks pass.
- Real keyboard output remains blocked.
