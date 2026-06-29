# Owner Review Checklist - Owner Trial 001

LOCAL ONLY - OWNER REVIEW ONLY - NOT PUBLIC RELEASE - NOT PRODUCTION

## Files That Exist

- `OWNER_TRIAL_001.uaos-trial.json`
- `MANIFEST.json`
- `CHECKSUMS.sha256`
- `README_OWNER_TRIAL_001.md`
- `VALIDATION.json`
- `OWNER_REVIEW_CHECKLIST.md`
- `KEYBOARD_TRANSFER_RISK_CHECKLIST.md`
- `NEXT_REAL_FORMAT_APPROVAL_GATE.md`

## What The Owner Can Inspect Safely

- Read the README and warning labels.
- Open `OWNER_TRIAL_001.uaos-trial.json` as text/JSON.
- Compare the file list in `MANIFEST.json`.
- Review `CHECKSUMS.sha256`.
- Review `VALIDATION.json`.
- Confirm every file says local-only, sandbox-only, experimental, and not production.

## What Must Not Be Copied To Keyboard Yet

- Do not copy `OWNER_TRIAL_001.uaos-trial.json` to a real keyboard as a keyboard-native file.
- Do not rename it into `.SET`, `.STY`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST`.
- Do not create a real-format package from it without a later approval gate.
- Do not treat it as a verified working keyboard file.

## Why `.uaos-trial.json` Is Not A Keyboard-Native File

`.uaos-trial.json` is a neutral sandbox representation. It is designed for owner review, metadata inspection, manifest/checksum testing, and risk review. It is not a known keyboard-native format and real keyboard compatibility is UNVERIFIED.

## Manifest / Checksum / Validation Review Steps

1. Open `MANIFEST.json` and confirm `candidate_id` is `owner-trial-001`.
2. Confirm `status` is `EXPERIMENTAL_SANDBOX_ONLY`.
3. Confirm `real_keyboard_compatibility` is `UNVERIFIED`.
4. Confirm `transfer_to_keyboard` is `OWNER_RISK_REVIEW_REQUIRED`.
5. Open `CHECKSUMS.sha256` and confirm it lists the candidate JSON, manifest, README, and validation.
6. Open `VALIDATION.json` and confirm it reports PASS.

## Experimental Warning

This candidate is an owner-controlled sandbox experiment. It is not a public release, not production, not guaranteed to work on a keyboard, and not safe to present as a finished writer/export feature.

## Rollback / No-Risk Notes

- If unsure, do nothing with the candidate.
- Keep the candidate inside `uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/`.
- Use the IMPL-019 backup note as proof that backup was created before writing the candidate.
- Removing or ignoring the sandbox candidate is safe because it is not connected to production behavior.
