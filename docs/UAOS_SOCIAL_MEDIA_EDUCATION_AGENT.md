# UAOS Social Media Education & Publishing Agent

Code name: `UAOSSocialMediaEducationAgent`

Marketing name: `UAOS Academy & Social Hub`

The agent discovers UAOS features, creates education plans for each feature, transforms tutorials into platform-specific drafts, and prepares dry-run publishing payloads for many platforms.

## Safety Defaults

- Default mode is `dry-run`.
- No public post is published by default.
- Live publishing requires OAuth/API configuration and explicit approval.
- Adapters are independent and are not wired directly into UI components.
- Capture plans use mock accounts, mock MIDI, mock hardware and synthetic audio.
- Rendering metadata is FFmpeg-only.

## Supported Adapter Families

- Video: YouTube, YouTube Shorts, TikTok, Instagram Reels, Facebook Reels, Snapchat Spotlight foundation.
- Feed: Instagram Feed, Facebook Pages, X/Twitter, LinkedIn, Threads, Pinterest foundation.
- Messaging/community: WhatsApp Channel, WhatsApp Status export, Telegram Channel, Telegram Group foundation, Discord Announcement foundation, Reddit post foundation.
- Future: generic social adapter, webhook, RSS, blog/CMS, website news.

## Content Outputs

Each tutorial can produce long video, short video, static post, carousel, story/status, FAQ, support-center summary, blog/newsletter foundation and social-thread drafts.

## Validation Command

Run:

```powershell
npm run social:agent:check
```

The command writes `reports/UAOS_SOCIAL_MEDIA_AGENT_REPORT.json` and `.md`.
