# UAOS Social Render Handoff

Status: BLOCKED_FFMPEG_OR_MANUAL_RENDER_REQUIRED
Tutorials: 140
Render manifests: 560
Blocked manifests: 560
Rendered files: 0

Prerequisites:
- Install FFmpeg locally or use a trusted manual video editor.
- Use only generated UAOS synthetic scripts, captions, thumbnails and manifests.
- Do not include user projects, private paths, account pages, tokens, commercial samples or copyrighted songs.
- Run validation before and after any manual render pass.

Local validation commands:
- npm run academy:validate:all
- npm run academy:handoff:readiness
- npm run academy:render:status
- npm run academy:queue:dry-run

Sample FFmpeg command:
- ffmpeg -y -f lavfi -i color=c=0x07111f:s=1920x1080:d=1:r=30 -an "social-output/tutorials/tutorial-001-start-here-what-is-uaos/renders/landscape.mp4"

Manual render steps:
- Open the tutorial render manifest.
- Render one sample landscape output first.
- Review narration, captions, safe margins, contrast and motion.
- Repeat for vertical, square and portrait formats after approval.
- Keep publication queue items in DRAFT until OAuth, legal review and owner approval are complete.

Publication allowed: false
Real network actions performed: false
