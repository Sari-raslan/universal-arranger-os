# UAOS SOCIAL PUBLICATION APPROVAL

Publication requires technical review, educational review, privacy review, copyright review, legal/brand review, owner approval and an explicit confirmation phrase.

Safe approval flow:
1. Run `npm run academy:approval:status` to regenerate the publication approval handoff.
2. Review `reports/UAOS_SOCIAL_PUBLICATION_APPROVAL_HANDOFF.md` and `social-output/queue/publication-queue.json`.
3. Keep every queue item in DRAFT until rendered media, narration, metadata, captions and thumbnails are manually approved.
4. Configure official OAuth/API credentials only after platform app review and owner approval.
5. Require the exact phrase `OWNER_APPROVES_SOCIAL_PUBLICATION` before private upload, unlisted upload, scheduling or public publication.

The approval status command never uploads, schedules, publishes, stores OAuth tokens or performs network actions.
