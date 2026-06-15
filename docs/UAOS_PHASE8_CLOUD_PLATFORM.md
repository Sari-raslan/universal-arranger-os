# UAOS Phase 8 Cloud Platform

Phase 8 provides the local production-backend foundation for accounts, project metadata sync, billing readiness and privacy controls. It is code-ready but intentionally not production-active.

## Scope

- Backend platform module: `server/cloud/phase8Platform.cjs`
- Mounted API surface in `backend/server.js`
- Frontend cloud/account surface in `uaos-live-clean/src/components/CloudPlatformPanel.jsx`
- Session schema v6 cloud state in `uaos-live-clean/src/cloud/cloudPhase8.js`

## Guarantees

- Raw audio upload is disabled by default.
- Commercial library upload is disabled by default.
- Stripe checkout and portal endpoints remain disabled until configured.
- Email uses a memory provider unless production SMTP is explicitly configured.
- Project sync is metadata-only foundation logic.
- Production activation remains false.
