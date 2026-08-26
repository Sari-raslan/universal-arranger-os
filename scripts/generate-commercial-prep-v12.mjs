/**
 * V12 commercial prep — prepared NOT published/deployed/sent
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "reports", "commercial-prep-v12");

function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, typeof content === "string" ? content : JSON.stringify(content, null, 2) + "\n");
}

const pricing = {
  PRICING_PUBLISHED: false,
  hypotheses: {
    MIDI_TOOLKIT: { LOW: 29, BASE: 59, PREMIUM: 99, currency: "EUR", note: "hypothesis only" },
    SINGY: { LOW: 19, BASE: 39, PREMIUM: 69, currency: "EUR", note: "family license hypothesis" },
    ARRANGER_STUDIO: { LOW: 49, BASE: 99, PREMIUM: 199, currency: "EUR", note: "frozen V11 pilot" }
  }
};

const products = [
  {
    id: "midi-toolkit",
    en: { title: "UAOS MIDI Toolkit", tagline: "Inspect, clean, and convert MIDI with format truth.", cta: "Start pilot" },
    de: { title: "UAOS MIDI Toolkit", tagline: "MIDI prüfen, bereinigen und konvertieren — mit Format-Wahrheit.", cta: "Pilot starten" },
    ar: { title: "مجموعة UAOS لـ MIDI", tagline: "فحص وتنظيف وتحويل MIDI بصدق تنسيقي.", cta: "ابدأ التجربة" }
  },
  {
    id: "singy",
    en: { title: "Singy", tagline: "One family — Kids or Teen — musical coach with built-in playback.", cta: "Choose your mode" },
    de: { title: "Singy", tagline: "Eine Familie — Kids oder Teen — musikalischer Coach mit eingebauter Wiedergabe.", cta: "Modus wählen" },
    ar: { title: "Singy", tagline: "عائلة واحدة — أطفال أو مراهقون — مدرب موسيقي مع تشغيل مدمج.", cta: "اختر الوضع" }
  }
];

for (const p of products) {
  for (const lang of ["en", "de", "ar"]) {
    write(`website/${p.id}/product-page.${lang}.md`, `# ${p[lang].title}\n\n${p[lang].tagline}\n\n**Status:** PRIVATE_PILOT_RC — WEBSITE_READY_NOT_DEPLOYED\n\n## CTA\n${p[lang].cta}\n`);
  }
  write(`brochure/${p.id}/BROCHURE.md`, `# ${p.en.title} brochure draft\n\nPrepared for internal pilot cohort.\n`);
  write(`outreach/${p.id}/OUTREACH_DRAFT.md`, `# Outreach draft\n\nNOT SENT. Founding pilot invite — owner approval required.\n`);
  write(`support/${p.id}/SUPPORT_POLICY_DRAFT.md`, `# Support policy draft\n\nPrivate pilot — best-effort, no SLA.\n`);
  write(`legal/${p.id}/REFUND_POLICY_DRAFT.md`, `# Refund policy draft\n\nNOT ACCEPTED — legal review required.\n`);
}

write("PRICING_HYPOTHESES.json", pricing);
write("PILOT_COHORT_CRITERIA.md", `# Pilot cohort criteria

- Can extract ZIP on Windows
- No developer environment required
- Willing to complete feedback form
- Accepts PRIVATE_PILOT_RC limitations
- No payment during founding pilot
`);
write("FEEDBACK_FORM_MASTER.md", `# Feedback form

1. CAN_INSTALL (Y/N)
2. CAN_START one-click (Y/N)
3. TIME_TO_FIRST_RESULT (seconds)
4. OUTPUT_USEFUL (1-5)
5. Blockers (free text)
`);
write("COMMERCIAL_PREP_STATUS.json", {
  WEBSITE_READY_NOT_DEPLOYED: true,
  OUTREACH_PREPARED_NOT_SENT: true,
  PRICING_READY_NOT_PUBLISHED: true,
  LEGAL_DRAFTS_READY_NOT_ACCEPTED: true,
  PAYMENT_ACTIVE: false,
  PUBLIC_RELEASE: false
});

// Copy into release packages
for (const folder of ["UAOS-MIDI-TOOLKIT-V12", "UAOS-SINGY-V12"]) {
  const dest = path.join(ROOT, "release-candidates", folder, "PILOT", "COMMERCIAL_PREP");
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(OUT, dest, { recursive: true });
}

console.log("commercial-prep-v12: OK", OUT);
