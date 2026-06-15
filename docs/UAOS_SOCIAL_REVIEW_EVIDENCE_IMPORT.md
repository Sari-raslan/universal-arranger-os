# UAOS SOCIAL REVIEW EVIDENCE IMPORT

The review evidence import template is a local checklist for human reviewers.

Safe evidence flow:
1. Run `npm run academy:evidence:template` to regenerate `reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json`.
2. Run `npm run academy:evidence:working` to create `social-output/reviews/reviewer-evidence-working.json` as the reviewer-owned working file.
3. Reference local rendered media, local narration audio and written review notes only.
4. Never paste OAuth secrets, cookies, refresh tokens, private URLs or personal data into evidence files.
5. Record OAuth evidence only as non-secret metadata: platformId, configured, appReviewApproved, accountVerified, scopesApproved, tokenStorageVerified and reviewerNote.
6. Run `npm run academy:evidence:audit` to count imported local evidence and catch unsafe unlock flags, secret-like keys, malformed fields, unsafe, missing or unsupported local artifact paths, stale content hashes, missing review provenance, duplicate IDs, unknown IDs, queue tutorial/platform mismatches and OAuth platform metadata issues.
7. Run `npm run academy:review:evidence` after manual review to confirm publication remains blocked until all gates are complete.

The template, working-file and audit commands never upload, schedule, publish, authenticate, record audio, render media or perform network actions.
