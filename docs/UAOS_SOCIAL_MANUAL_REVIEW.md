# UAOS Social Manual Review

Review scripts, captions, thumbnails, platform packages, copyright safety, privacy safety, and route evidence before connecting any real account.

## Review Evidence Gate

Run `npm run academy:review:evidence` before any private upload, unlisted upload, scheduling, or public publication decision.

The gate checks local status only:

- Rendered media outputs must be approved for every required format.
- Narration audio must be approved for every tutorial language.
- Technical, educational, privacy, copyright, legal/brand, rendered-media, narration, and owner approval evidence must exist for every queue item.
- Official platform OAuth/API configuration must be complete before upload or scheduling.
- The owner approval phrase must be exactly `OWNER_APPROVES_SOCIAL_PUBLICATION`.

The command does not upload, schedule, publish, store OAuth tokens, record audio, or perform network actions.
