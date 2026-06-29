# Transfer Risk Checklist

Status: local plan only

- Current remote verification: confirm origin still points to `https://github.com/Sari-raslan/universal-arranger-os.git`.
- Target repo availability: owner may manually check `https://github.com/aeplatform-app/universal-arranger-os.git` with the documented read-only command.
- Branch protection planning: prepare rules before switching day-to-day work to the target owner.
- GitHub Pages risk: confirm whether Pages is disabled, paused, or intentionally reconfigured after transfer.
- Secrets risk: review repository and environment secrets before any integration is reconnected.
- Vercel integration risk: do not connect or deploy until transfer and staging policy are approved.
- Domain risk: confirm `aeplatform.online` ownership, DNS plan, and staging-only release gate before any public mapping.
- Admin email: confirm `admin@aeplatform.app` is the correct administrative contact.
- Repo ownership risk: confirm the AE Platform owner account or organization has durable admin access.
- No commit publication before transfer.
- No deploy before transfer.
- No payment flow before transfer.
- No writer/export feature before transfer.
