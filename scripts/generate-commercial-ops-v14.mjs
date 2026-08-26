/**
 * Generate email/content + design/social internal packs for V14 3-SKU truth.
 * No send, no publish, no paid ads.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "reports", "commercial-ops-v14");

function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`);
}

const products = [
  {
    id: "arranger-studio",
    name: "UAOS Arranger Studio",
    zip: "UAOS_ARRANGER_STUDIO_V14.zip",
    sha: "f78a93fd9bfff25b071ea9b3d46cb9cb0f55414cb20964989df40c26c6f20efb",
    start: "START-UAOS-ARRANGER-STUDIO.bat",
    priceRec: "EUR49",
  },
  {
    id: "midi-toolkit",
    name: "UAOS MIDI Toolkit",
    zip: "UAOS_MIDI_TOOLKIT_V14.zip",
    sha: "73de6abb70a920e2d2acc6966df9d05dd171d40b2c3dedbd161c7737fdced63c",
    start: "START-UAOS-MIDI-TOOLKIT.bat",
    priceRec: "EUR39",
  },
  {
    id: "singy",
    name: "Singy",
    zip: "UAOS_SINGY_V14.zip",
    sha: "42916b5db0eb884dc4a7b8e85cfdffa0c196c16b6bf6c577cd02424543368e23",
    start: "START-SINGY.bat",
    priceRec: "EUR29",
  },
];

write(
  "EMAIL_OPS/README.md",
  `# Email / Business Communication Ops

Business sender identity: **admin@aeplatform.app** (AE Platform / UAOS)

Gmail may be used for reading/triage/drafting only.

**EMAIL_SENT=NO** unless actual send evidence exists.

Before any external send, fill:

\`\`\`
RECIPIENT=
SENDER=admin@aeplatform.app
SUBJECT=
FULL_BODY=
ATTACHMENTS/LINKS=
PRICE/TERMS=
EXPECTED_NEXT_EVENT=
\`\`\`

Then wait for exact owner approval.
`
);

for (const p of products) {
  write(
    `CONTENT/${p.id}/en/QUICK_START.md`,
    `# ${p.name} — Quick Start (EN)

1. Extract \`${p.zip}\`
2. Double-click \`${p.start}\`
3. Follow on-screen journey
4. Export diagnostics if you need support

SHA256: \`${p.sha}\`
No Node/npm/Git required.
`
  );
  write(
    `CONTENT/${p.id}/en/FAQ.md`,
    `# FAQ — ${p.name}

**Public release?** No.  
**Payment active?** No.  
**Need developer tools?** No.  
**Commander included?** No.  
**Proprietary WRITE?** Not invented; gated where applicable.
`
  );
  write(
    `CONTENT/${p.id}/en/RELEASE_NOTES.md`,
    `# Release notes — ${p.name} V14

- Production-candidate customer shell
- Smart port recovery / START+STOP
- EN/DE/AR where applicable
- Safe diagnostics
- INTERNAL_PRODUCT_COMPLETION=PASS
`
  );
  write(
    `EMAIL_OPS/drafts/${p.id}/SUPPORT_REPLY_TEMPLATE.md`,
    `From: admin@aeplatform.app
Subject: Re: ${p.name} support

Thank you for contacting AE Platform / UAOS.

Please reply with:
1) what you tried
2) exact error text
3) optional diagnostics export from the product

Founding pilot support is best-effort (no SLA).

— UAOS Support
`
  );
  write(
    `EMAIL_OPS/drafts/${p.id}/DELIVERY_DRAFT.md`,
    `From: admin@aeplatform.app
Subject: Delivery — ${p.name} private founding pilot

File: ${p.zip}
SHA256: ${p.sha}
Start: ${p.start}

Extract, then double-click Start. Feedback form follows separately.

NOT SENT — awaiting exact send approval.
`
  );

  // Design + social
  for (const ratio of ["1x1", "4x5", "9x16", "16x9"]) {
    const [w, h] = ratio === "1x1" ? [1080, 1080] : ratio === "4x5" ? [1080, 1350] : ratio === "9x16" ? [1080, 1920] : [1920, 1080];
    write(
      `DESIGN_SOCIAL/${p.id}/creatives/${ratio}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#02030a"/><stop offset="1" stop-color="#1a2040"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="42%" fill="#f8f8ff" font-family="Segoe UI,Arial" font-size="${Math.round(w / 18)}" text-anchor="middle">${p.name}</text>
  <text x="50%" y="52%" fill="#b8c3dc" font-family="Segoe UI,Arial" font-size="${Math.round(w / 36)}" text-anchor="middle">UAOS / AE Platform · Private Pilot</text>
  <text x="50%" y="60%" fill="#00d4ff" font-family="Segoe UI,Arial" font-size="${Math.round(w / 40)}" text-anchor="middle">${ratio} · NOT PUBLISHED</text>
</svg>`
    );
  }

  write(
    `DESIGN_SOCIAL/${p.id}/CAPTIONS.json`,
    {
      EN: {
        organic: `${p.name} — private founding pilot. One-click Windows. No hype claims.`,
        paid: `${p.name}. Arranger / MIDI / Singy family. Invite-only pilot.`,
      },
      DE: {
        organic: `${p.name} — privater Founding Pilot. Ein-Klick Windows.`,
        paid: `${p.name}. Nur per Einladung.`,
      },
      AR: {
        organic: `${p.name} — تجربة تأسيس خاصة. ويندوز بنقرة واحدة.`,
        paid: `${p.name}. بدعوة فقط.`,
      },
      cta: "Learn more (owner-approved link)",
      hashtags: ["#UAOS", "#AEPlatform", "#MusicSoftware"],
      SOCIAL_POSTED: false,
      PAID_AD_SPEND: 0,
    }
  );
}

write("DESIGN_SOCIAL/CONTENT_CALENDAR.md", `# Content calendar (prepared, not posted)

Week 0: Arranger Studio soft-intro (organic draft)
Week 1: MIDI Toolkit format-truth post
Week 2: Singy Kids/Teen chooser
Week 3: Founding pilot FAQ

SOCIAL_POSTED=NO · PAID_AD_SPEND=0
`);

write("DESIGN_SOCIAL/PAID_ADS_HYPOTHESIS.json", {
  PAID_AD_SPEND: 0,
  activationRequires: ["PLATFORM", "CAMPAIGN", "BUDGET", "CURRENCY", "DURATION", "TARGETING", "CREATIVE", "DESTINATION", "OWNER_APPROVAL"],
  hypotheses: products.map((p) => ({
    product: p.name,
    audience: "Windows musicians / arranger keyboard users / MIDI producers",
    creativeFolder: `DESIGN_SOCIAL/${p.id}/creatives`,
  })),
});

write("STATUS.json", {
  EMAIL_CONTENT_INTERNAL_COMPLETION: "PASS",
  DESIGN_SOCIAL_INTERNAL_COMPLETION: "PASS",
  EMAIL_SENT: false,
  SOCIAL_POSTED: false,
  PAID_AD_SPEND: 0,
  senderIdentity: "admin@aeplatform.app",
  updatedAt: new Date().toISOString(),
});

console.log("commercial-ops-v14 OK", OUT);
