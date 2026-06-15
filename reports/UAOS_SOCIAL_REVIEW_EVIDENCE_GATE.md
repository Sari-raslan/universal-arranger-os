# UAOS Social Review Evidence Gate

Status: BLOCKED_REVIEW_EVIDENCE
Tutorials: 140
Render manifests: 560
Rendered files: 0
Approved narration assets: 0/420
Queue items: 700
Draft queue items: 700
OAuth configured: 0/23
Approved phrases: 0

Required evidence:
- rendered-media-approved
- narration-approved
- technical-review
- educational-review
- privacy-review
- copyright-review
- legal-brand-review
- owner-approval
- OWNER_APPROVES_SOCIAL_PUBLICATION

Blockers:
- Rendered media outputs are not approved for every required format.
- Narration audio is not approved for every tutorial language.
- Queue review evidence is incomplete.
- Platform OAuth/API configuration is incomplete.
- Publication queue remains in DRAFT.

Safe local commands:
- npm run academy:evidence:template
- npm run academy:evidence:audit
- npm run academy:review:evidence
- npm run academy:render:status
- npm run academy:narration:status
- npm run academy:approval:status
- npm run academy:oauth:status

Evidence import template:
- reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json
- reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_AUDIT.json
- Template only; it does not approve, upload, schedule, publish, authenticate, record or render.

Publication allowed: false
Private upload allowed: false
Unlisted upload allowed: false
Real network actions performed: false
