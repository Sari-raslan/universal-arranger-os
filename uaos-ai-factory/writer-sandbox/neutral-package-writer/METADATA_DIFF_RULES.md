# Metadata Diff Rules

LOCAL ONLY - RULES ONLY - NO KEYBOARD OUTPUT

## Comparison Rules

Compare JSON fields structurally, not by copying or transforming package content.

## Rule Groups

### Identity

- `package_id`
- `status`
- `source_package`
- `safe_extension`

### Safety

- `owner_only`
- `not_public_release`
- `not_production`
- `keyboard_native`
- `real_keyboard_compatibility`
- `no_push`
- `no_deploy`
- `no_vercel`
- `no_payment`
- `no_proprietary_samples`
- `no_kontakt_native_instruments_content`
- `no_keyboard_native_output`
- `no_set_sty_output`

### Arrangement Metadata

- Sections by `section_id`.
- Tracks by `track_id`.
- Tempo, key, mood, and style intent.
- Chord/style placeholders.

### Validation

- Validation status.
- Manifest reference.
- Checksum reference.
- Rollback notes.

## Result Labels

- `UNCHANGED_SAFE`
- `IMPROVED_CLEARER`
- `ADDED_SAFETY`
- `OWNER_REVIEW_ATTENTION`
- `BLOCKED_UNSAFE`

## Blocked Diff Behavior

The future diff tool must not:

- Inspect legacy binary content.
- Create keyboard-native files.
- Rename neutral files to keyboard extensions.
- Copy proprietary content.
- Execute external automation.

## Expected Recommendation Logic

Recommend `owner-neutral-003` when:

- Validation is PASS.
- `keyboard_native` is false.
- Compatibility is `UNVERIFIED`.
- Safety labels are stronger or equal.
- Metadata is richer or clearer.

Otherwise recommend owner review before continuing.
