# UAOS Social Publication Approval Handoff

Status: BLOCKED_PUBLICATION_APPROVAL
Tutorials: 140
Queue items: 700
Draft items: 700
Owner-approved items: 0
Private-ready items: 0
Public-ready items: 0

Required evidence:
- technicalReview
- educationalReview
- legalBrandReview
- privacyReview
- copyrightReview
- renderedMediaApproved
- narrationApproved
- ownerApproval
- approvalPhrase

Blockers:
- Approve rendered media for every platform item after FFmpeg/manual render output exists.
- Approve narration audio for every tutorial and language before any upload.
- Complete technical, educational, privacy, copyright and legal/brand review.
- Configure official platform OAuth/API credentials and verify platform accounts.
- Record owner approval with the exact phrase OWNER_APPROVES_SOCIAL_PUBLICATION before private, unlisted, scheduled or public posting.

Safe local commands:
- npm run academy:approval:status
- npm run academy:queue:dry-run
- npm run academy:handoff:readiness
- npm run academy:validate:all

Publication allowed: false
Private upload allowed: false
Unlisted upload allowed: false
Real network actions performed: false
