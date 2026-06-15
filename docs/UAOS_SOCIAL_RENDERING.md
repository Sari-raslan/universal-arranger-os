# UAOS SOCIAL RENDERING

Rendering uses generated manifests and FFmpeg-compatible commands only.

Safe render flow:
1. Run `npm run academy:render:status` to regenerate the render readiness reports.
2. Run `npm run academy:render:sample` before any batch work.
3. Review `reports/UAOS_SOCIAL_RENDER_HANDOFF.md` and the per-tutorial `renders/manifest.json` files.
4. Render manually or with FFmpeg only after checking narration, captions, safe margins, contrast and motion.
5. Keep every publication queue item in DRAFT until OAuth, legal review and owner approval are complete.

The command never uploads, schedules, publishes, stores OAuth tokens or performs network actions.
