# Visual QA Selected Package Panel Checklist

LOCAL ONLY - MANUAL QA ONLY - NOT KEYBOARD OUTPUT

Use this checklist after any future approved UI change touching the selected package panel.

## Required Visible Content

- [ ] Panel visible.
- [ ] `Selected Neutral Package` title visible.
- [ ] `owner-neutral-003` visible.
- [ ] `LOCAL ONLY` visible.
- [ ] `READ ONLY` visible.
- [ ] `NOT KEYBOARD OUTPUT` visible.
- [ ] `Validation: PASS` visible.
- [ ] `Real keyboard output: NO` visible.
- [ ] `Keyboard transfer: NO` visible.

## Required Absences

- [ ] No export button in panel.
- [ ] No payment action in panel.
- [ ] No deploy/public wording.
- [ ] No keyboard compatibility claim.
- [ ] No text implying ready for keyboard.
- [ ] No text implying production or live release.

## Layout Checks

- [ ] Responsive layout remains readable on narrow and wide screens.
- [ ] Panel text does not overlap other UI elements.
- [ ] Dark mode/readability remains acceptable.
- [ ] Safety badges remain readable.

## Stop Conditions

Stop and fail visual QA if the panel implies keyboard-native readiness, keyboard transfer, public release, production release, payment readiness, or real writer readiness.

