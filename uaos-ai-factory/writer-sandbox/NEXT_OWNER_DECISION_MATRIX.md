# Next Owner Decision Matrix

LOCAL ONLY - DECISION SUPPORT ONLY - NO KEYBOARD TRANSFER

## Option A: Review owner-neutral-002

Risk: LOW

Recommended: YES

Allowed actions:

- Open `OWNER_NEUTRAL_002.uaos-neutral.json` as text.
- Review sections, tracks, metadata, naming, and safety labels.
- Fill owner inspection notes.

Forbidden actions:

- Do not transfer to keyboard.
- Do not rename to `.STY` or `.SET`.
- Do not mix with legacy `.STY` files.

Needed approval: none for manual review.

Expected outputs: owner notes or feedback.

Stop condition: any confusion about safety labels or package meaning.

Safety notes: best next step.

## Option B: Revise owner-neutral-003

Risk: LOW

Recommended: if owner finds metadata issues.

Allowed actions:

- Plan or create a revised neutral `.uaos-neutral.json` package.
- Keep manifest, checksum, validation, and safety labels.

Forbidden actions:

- No keyboard-native extension.
- No proprietary samples.
- No legacy `.STY` content.

Needed approval: bounded local task approval.

Expected outputs: `owner-neutral-003` neutral package and report.

Stop condition: request would require real keyboard format.

Safety notes: safe if neutral JSON only.

## Option C: Continue Safe Writer Research Only

Risk: LOW/MEDIUM

Allowed actions:

- Research metadata schemas.
- Write docs/specs.
- Improve validators.

Forbidden actions:

- No real keyboard output.
- No legacy binary content reads.
- No deploy/payment/public release.

Needed approval: bounded local research task.

Expected outputs: research notes or design docs.

Stop condition: research becomes real output or compatibility claim.

Safety notes: keep local and metadata-only.

## Option D: Metadata-Only Quarantine Execution

Risk: MEDIUM

Allowed actions:

- Only after exact owner approval.
- Plan metadata-only quarantine handling with backup.

Forbidden actions:

- No deletion.
- No keyboard transfer.
- No proprietary content use.
- No unapproved movement or copying.

Needed approval:

`I approve metadata-only quarantine execution for legacy keyboard files, with backup, no deletion, no keyboard transfer, no push, no deploy, no Vercel, and no proprietary content use.`

Expected outputs: approval-gated quarantine execution docs/metadata only.

Stop condition: any need to read/copy binary contents or transfer to keyboard.

Safety notes: approval required.

## Option E: Real Keyboard-Format Output

Risk: HIGH

Currently blocked unless exact high-risk approval is given and the legacy issue is handled.

Allowed actions:

- Planning only until explicit high-risk approval.

Forbidden actions:

- No `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` output now.
- No fake-safe output.
- No proprietary samples.

Needed approval: exact high-risk real-format approval from prior gates.

Expected outputs: only after a separate bounded approved task.

Stop condition: legacy issue unresolved or owner approval missing.

Safety notes: not recommended now.

## Option F: Keyboard Transfer

Risk: HIGH

Currently: NO

Allowed actions:

- None in current state.

Forbidden actions:

- Do not transfer neutral package.
- Do not transfer legacy `.STY` files.
- Do not transfer any generated manifest/checksum/validation file.

Needed approval: separate future process after compatibility and safety validation.

Expected outputs: none now.

Stop condition: always stop before transfer.

Safety notes: keyboard transfer remains blocked.
