import React, { useEffect, useMemo, useState } from "react";
import "./style.css";

const STORAGE_KEY = "uaos_v8_projects";
const ACTIVE_KEY = "uaos_v8_active_project";
const NOTES_KEY = "uaos_v8_notes";

const templates = [
  {
    id: "arabic-pop-ballad",
    name: "Arabic Pop Ballad",
    bpm: 86,
    key: "D minor",
    groove: "Soft 4/4",
    description: "Warm singer arrangement with emotional strings and a clean chorus lift.",
    sections: [
      { name: "Intro", bars: 4, energy: 35, chord: "Dm - Bb - C - Dm" },
      { name: "Verse", bars: 8, energy: 48, chord: "Dm - C - Bb - A" },
      { name: "Chorus", bars: 8, energy: 78, chord: "Bb - C - Dm - Dm" },
      { name: "Fill", bars: 2, energy: 90, chord: "A - A" },
      { name: "Ending", bars: 4, energy: 45, chord: "Bb - A - Dm" },
    ],
  },
  {
    id: "modern-dabke-live",
    name: "Modern Dabke Live",
    bpm: 112,
    key: "G minor",
    groove: "Dabke 4/4",
    description: "Live keyboard energy with strong rhythm and fast crowd feel.",
    sections: [
      { name: "Intro", bars: 4, energy: 70, chord: "Gm - F - Eb - D" },
      { name: "Main A", bars: 8, energy: 86, chord: "Gm - Gm - F - Gm" },
      { name: "Break", bars: 4, energy: 92, chord: "D - Eb - F - Gm" },
      { name: "Solo", bars: 8, energy: 96, chord: "Gm - F - Eb - D" },
      { name: "Ending", bars: 4, energy: 80, chord: "Eb - D - Gm" },
    ],
  },
  {
    id: "cinematic-strings",
    name: "Cinematic Strings",
    bpm: 76,
    key: "C minor",
    groove: "Slow cinematic",
    description: "Slow emotional arrangement for dramatic demos and orchestral sketches.",
    sections: [
      { name: "Intro", bars: 4, energy: 25, chord: "Cm - Ab - Eb - Bb" },
      { name: "Theme", bars: 8, energy: 52, chord: "Cm - Ab - Fm - G" },
      { name: "Build", bars: 8, energy: 82, chord: "Ab - Bb - Cm - Cm" },
      { name: "Finale", bars: 8, energy: 92, chord: "Fm - G - Cm" },
    ],
  },
];

const trackRoles = [
  { id: "drums", name: "Drums", pattern: "Beat / Fill / Groove support" },
  { id: "bass", name: "Bass", pattern: "Low-end root movement" },
  { id: "chords", name: "Chords", pattern: "Harmony support" },
  { id: "pad", name: "Pad", pattern: "Atmosphere and texture" },
  { id: "melody", name: "Melody Guide", pattern: "Lead phrase / singer guide" },
];

const songStyles = {
  Pop: { genre: "Pop", tempo: 104, key: "C minor", mood: "modern and hook-focused", drums: "basic-4-4", bass: "root-pulse", chords: ["i", "VI", "iv", "V"], pad: "soft-wide-pad" },
  Oriental: { genre: "Oriental Pop", tempo: 104, key: "Nahawand", mood: "warm, melodic, modal", drums: "darbuka + riq metadata", bass: "oriental-root", chords: ["tonic", "lower-neighbor", "dominant", "tonic"], pad: "soft-wide-pad" },
  Ballad: { genre: "Pop Ballad", tempo: 76, key: "A minor", mood: "emotional and spacious", drums: "soft-ballad-brush", bass: "ballad-walk", chords: ["i", "VI", "III", "VII"], pad: "strong-pad" },
  Wedding: { genre: "Wedding Keyboard", tempo: 112, key: "D Kurd", mood: "celebration and lift", drums: "oriental-pop-light", bass: "root-octave", chords: ["tonic", "VII", "VI", "dominant"], pad: "wide-pad" },
  Dabke: { genre: "Dabke Sketch", tempo: 124, key: "D Hijaz", mood: "strong rhythmic dance", drums: "dabke-step-demo", bass: "root-octave-drive", chords: ["tonic", "flat-II", "tonic", "VII"], pad: "support-pad" },
  "R&B": { genre: "R&B Groove", tempo: 92, key: "F minor", mood: "smooth and syncopated", drums: "rnb-pocket-demo", bass: "syncopated-root", chords: ["i7", "iv7", "VImaj7", "V7"], pad: "warm-pad" },
  Film: { genre: "Film Score Sketch", tempo: 80, key: "D minor", mood: "cinematic slow build", drums: "cinematic-pulse", bass: "pedal-tone", chords: ["i", "VI", "III", "VII"], pad: "film-bed" },
  Worship: { genre: "Worship Ballad", tempo: 72, key: "G major", mood: "open and reflective", drums: "soft-ballad", bass: "root-pulse", chords: ["I", "V", "vi", "IV"], pad: "soft-wide-pad" },
};

const arrangerSectionNames = [
  "Intro 1", "Intro 2", "Intro 3", "Verse A", "Verse B", "Chorus", "Bridge",
  "Fill 1", "Fill 2", "Fill 3", "Break", "Ending 1", "Ending 2", "Ending 3",
];

const arrangerTrackNames = [
  "Drums", "Percussion", "Bass", "Chords", "Pad", "Strings", "Lead / Melody Guide", "FX / Hits",
];

const arrangerVariations = [
  { name: "Variation A", energy: "quiet" },
  { name: "Variation B", energy: "medium" },
  { name: "Variation C", energy: "strong" },
  { name: "Variation D", energy: "full" },
  { name: "Fill Up", energy: "increase energy" },
  { name: "Fill Down", energy: "reduce energy" },
  { name: "Break", energy: "short stop" },
  { name: "Ending", energy: "final cadence" },
];

const gmTrackMap = [
  { name: "Drums", channel: 9, program: 0, baseNote: 36 },
  { name: "Percussion", channel: 9, program: 0, baseNote: 60 },
  { name: "Bass", channel: 1, program: 33, baseNote: 40 },
  { name: "Chords", channel: 2, program: 0, baseNote: 60 },
  { name: "Pad", channel: 3, program: 89, baseNote: 55 },
  { name: "Strings", channel: 4, program: 48, baseNote: 67 },
  { name: "Lead / Melody Guide", channel: 5, program: 80, baseNote: 72 },
  { name: "FX / Hits", channel: 6, program: 97, baseNote: 84 },
];

const selectedNeutralPackageSnapshot = {
  selectedPackageId: "owner-neutral-003",
  packageType: ".uaos-neutral.json",
  keyboardNative: false,
  compatibility: "UNVERIFIED",
  validationStatus: "PASS",
  reviewStatus: "Owner manual review",
  realKeyboardOutput: "NO",
  keyboardTransfer: "NO",
  safeNextAction: "Review metadata / no keyboard transfer",
  safetyLabels: [
    "LOCAL ONLY",
    "READ ONLY",
    "NOT PUBLIC RELEASE",
    "NOT KEYBOARD OUTPUT",
  ],
};

const selectedNeutralPackagePanel = {
  selectedPackageId: selectedNeutralPackageSnapshot.selectedPackageId || "owner-neutral-003",
  packageType: selectedNeutralPackageSnapshot.packageType || ".uaos-neutral.json",
  keyboardNative: selectedNeutralPackageSnapshot.keyboardNative === false ? "NO" : "NO",
  compatibility: selectedNeutralPackageSnapshot.compatibility || "UNVERIFIED",
  validationStatus: selectedNeutralPackageSnapshot.validationStatus || "PASS",
  reviewStatus: selectedNeutralPackageSnapshot.reviewStatus || "Owner manual review",
  realKeyboardOutput: selectedNeutralPackageSnapshot.realKeyboardOutput || "NO",
  keyboardTransfer: selectedNeutralPackageSnapshot.keyboardTransfer || "NO",
  safeNextAction:
    selectedNeutralPackageSnapshot.safeNextAction || "Review metadata / no keyboard transfer",
  safetyLabels:
    selectedNeutralPackageSnapshot.safetyLabels?.length > 0
      ? selectedNeutralPackageSnapshot.safetyLabels
      : ["LOCAL ONLY", "READ ONLY", "NOT PUBLIC RELEASE", "NOT KEYBOARD OUTPUT"],
};

const ownerProgramSections = [
  {
    title: "Final Local Owner Program V2",
    status: "PASS",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\UAOS_FINAL_LOCAL_OWNER_PROGRAM_V2",
    ownerTest: "Open the owner program dashboard and review the complete local workflow.",
    blocked: "No deploy, no push, no device writer.",
  },
  {
    title: "Style Package RC",
    status: "PASS",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\style-package-rc",
    ownerTest: "Review the release-candidate style package metadata and owner notes.",
    blocked: "Real keyboard style generation remains blocked.",
  },
  {
    title: "Style-to-MIDI Sync",
    status: "PASS",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\style-midi-sync-track",
    ownerTest: "Compare section maps against the generated MIDI test materials.",
    blocked: "No keyboard-native export approval.",
  },
  {
    title: "MIDI Exports",
    status: "PASS",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\style-export-track-v2",
    ownerTest: "Load the generic MIDI files in a DAW and record listening feedback.",
    blocked: "No USB transfer and no PA3X load.",
  },
  {
    title: "Priority Library MIDI",
    status: "PASS",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\priority-library-midi-test-arrangement",
    ownerTest: "Audition top-priority arrangement tests and mark favorites.",
    blocked: "No commercial claim and no keyboard compatibility claim.",
  },
  {
    title: "Sound Library",
    status: "PASS",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\sound-library-priority-refinement",
    ownerTest: "Review the top packs, presets, and priority refinement notes.",
    blocked: "No real KORG writer use.",
  },
  {
    title: "KORG Read-only Research",
    status: "READ ONLY",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\korg-readonly-research-gate",
    ownerTest: "Read format notes and research gates without writing files.",
    blocked: "KORG Writer BLOCKED.",
  },
  {
    title: "Read-only Parser Scaffold",
    status: "READ ONLY",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\korg-readonly-parser-scaffold",
    ownerTest: "Inspect parser scaffold reports with write paths disabled.",
    blocked: "Binary writer and real style generation blocked.",
  },
  {
    title: "Safety Gates",
    status: "ACTIVE",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\UAOS_RELAXED_PRODUCT_MODE_POLICY.md",
    ownerTest: "Confirm relaxed product mode still blocks real KORG writer actions.",
    blocked: "No push or deploy in this task.",
  },
  {
    title: "Next Actions",
    status: "READY",
    localPath: "E:\\keyboard-manager-clean\\uaos-ai-factory\\react-app-integration-relaxed-mode",
    ownerTest: "Review this React integration dashboard, then choose local owner QA.",
    blocked: "Deploy and push only when explicitly requested.",
  },
];

const ownerSafetyGates = [
  "KORG Writer BLOCKED",
  ".STY/.SET BLOCKED",
  "USB BLOCKED",
  "PA3X Load BLOCKED",
  "Deploy NOT RUN IN THIS TASK",
];

function uid() {
  return "uaos-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function createProject(template, title = "My UAOS Arrangement") {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title,
    templateId: template.id,
    templateName: template.name,
    bpm: template.bpm,
    key: template.key,
    groove: template.groove,
    description: template.description,
    sections: template.sections,
    enabledTracks: trackRoles.map((t) => t.id),
    generatedAt: null,
    savedAt: null,
    notes: "Project notes...",
    createdAt: now,
    updatedAt: now,
  };
}

function buildArrangement(project) {
  return project.sections.map((section, index) => ({
    ...section,
    cue:
      section.energy > 85
        ? "Big live moment"
        : section.energy > 60
        ? "Full arrangement"
        : "Controlled intro / verse feel",
    tracks: trackRoles
      .filter((track) => project.enabledTracks.includes(track.id))
      .map((track, trackIndex) => ({
        ...track,
        intensity: Math.min(100, Math.max(20, section.energy + trackIndex * 2 - index)),
      })),
  }));
}

function readProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadTextFile(filename, text, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadBytes(filename, bytes, type = "audio/midi") {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function cleanFilename(value) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "uaos_project";
}

function createSongArrangerProject(input) {
  const styleName = songStyles[input.style] ? input.style : "Oriental";
  const preset = songStyles[styleName];
  const title = input.title.trim() || "Untitled UAOS Song Idea";
  const tempo = Math.max(56, Math.min(156, Number.parseInt(input.tempo, 10) || preset.tempo));
  const key = input.key.trim() || preset.key;
  const mood = input.mood.trim() || preset.mood;
  let bar = 1;
  const sections = arrangerSectionNames.map((name, index) => {
    const bars = getSectionBars(name, preset.genre);
    const result = { name, bars, startBar: bar, endBar: bar + bars - 1, role: sectionRole(name, index) };
    bar += bars;
    return result;
  });

  const grid = sections.flatMap((section, sectionIndex) =>
    Array.from({ length: section.bars }, (_, offset) => {
      const energyLevel = sectionEnergy(section.name, sectionIndex);
      const fillTrigger = section.name.startsWith("Fill")
        ? section.name
        : offset === section.bars - 1 && !section.name.startsWith("Ending")
        ? energyLevel >= 3 ? "Fill Up" : "Fill Down"
        : "none";
      return {
        bar: section.startBar + offset,
        barRange: `${section.startBar}-${section.endBar}`,
        section: section.name,
        chord: preset.chords[(sectionIndex + offset) % preset.chords.length],
        drumsPattern: `${preset.drums}:${(offset % 4) + 1}`,
        bassPattern: `${preset.bass}:${(offset % 4) + 1}`,
        chordCompPattern: preset.chords.join(" - "),
        padPattern: preset.pad,
        melodyGuide: `${key} ${section.name} guide ${offset + 1}`,
        energyLevel,
        fillTrigger,
        variation: ["Variation A", "Variation B", "Variation C", "Variation D"][Math.max(0, Math.min(3, energyLevel - 1))],
      };
    })
  );

  const sectionTimeline = sections.map((section, index) => {
    const rows = grid.filter((row) => row.section === section.name);
    const energyLevel = sectionEnergy(section.name, index);
    return {
      section: section.name,
      barRange: `${section.startBar}-${section.endBar}`,
      durationBars: section.bars,
      chordTimeline: rows.map((row) => row.chord).filter((chord, chordIndex, all) => chordIndex === 0 || chord !== all[chordIndex - 1]),
      fillBeforeTransition: rows[rows.length - 1]?.fillTrigger || "none",
      endingSelection: section.name.startsWith("Ending") ? section.name : "none",
      variationIntensity: ["A quiet", "B medium", "C strong", "D full"][Math.max(0, Math.min(3, energyLevel - 1))],
      trackActivity: buildTrackActivity(section.name, energyLevel),
    };
  });

  return {
    version: "UAOS SONG TO ARRANGER SEQUENCER MVP V1",
    generatedAt: new Date().toISOString(),
    input: { ...input, title },
    analysis: {
      title,
      referenceStyle: input.reference.trim() || "UAOS internal style inference",
      genre: preset.genre,
      tempo,
      key,
      mood,
      arrangementPlan: `Generate ${preset.genre} arranger project with ${sections.length} sections, ${grid.length} bars, ${arrangerTrackNames.length} tracks, variations, fills, endings, and safe demo exports.`,
    },
    sections,
    sectionTimeline,
    tracks: arrangerTrackNames.map((name, index) => ({
      name,
      role: name === "Lead / Melody Guide" ? "safe internal melody guide" : "arrangement support",
      events: grid.slice(0, 8).map((row) => ({
        bar: row.bar,
        event: `${name} ${row.chord}`,
        velocity: Math.min(112, 62 + row.energyLevel * 10 + index),
      })),
    })),
    variations: arrangerVariations,
    sequencerGrid: grid,
    playbackPlan: {
      bpm: tempo,
      bars: grid.length,
      timeline: sections.map((section) => ({
        bar: section.startBar,
        section: section.name,
        trackEvents: ["drums", "bass", "chords", "pad", "melody guide"],
        chordEvents: grid.filter((row) => row.bar >= section.startBar && row.bar <= section.endBar).slice(0, 4).map((row) => row.chord),
        transition: section.name.startsWith("Fill") ? "fill trigger" : "section transition",
      })),
      noteEvents: grid.slice(0, 16).map((row) => ({ bar: row.bar, note: row.melodyGuide, chord: row.chord })),
      drumHits: grid.slice(0, 16).map((row) => ({ bar: row.bar, hit: row.drumsPattern })),
    },
    exports: { json: true, htmlPreview: true, markdownSummary: true, demoMidi: true },
    safety: {
      internalProjectOnly: true,
      realDeviceWriter: "BLOCKED",
      realKeyboardOutput: "BLOCKED",
      forbiddenWriterFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
      copyrightedMelodyCopied: false,
    },
  };
}

function getSectionBars(name, genre) {
  if (name.startsWith("Fill")) return 1;
  if (name === "Break") return 2;
  if (name === "Intro 1") return genre.includes("Film") ? 8 : 4;
  if (name === "Intro 2") return 4;
  if (name === "Intro 3") return 8;
  if (name.includes("Verse") || name === "Chorus" || name === "Bridge") return 8;
  if (name === "Ending 1") return 4;
  if (name === "Ending 2") return 4;
  if (name === "Ending 3") return genre.includes("Ballad") || genre.includes("Film") ? 8 : 4;
  return 4;
}

function buildTrackActivity(sectionName, energyLevel) {
  return {
    Drums: sectionName === "Intro 1" ? "light" : energyLevel >= 3 ? "full" : "medium",
    Percussion: sectionName.startsWith("Fill") ? "fill accent" : energyLevel >= 2 ? "active" : "soft",
    Bass: energyLevel >= 2 ? "active" : "root guide",
    Chords: "active",
    Pad: energyLevel <= 2 ? "wide support" : "layered",
    Strings: energyLevel >= 3 ? "build" : "response",
    "Lead / Melody Guide": sectionName.includes("Chorus") ? "hook guide" : "motif guide",
    "FX / Hits": sectionName.startsWith("Fill") || sectionName.includes("Ending") ? "hit markers" : "section markers",
  };
}

function sectionRole(name, index) {
  if (name.startsWith("Intro")) return index === 0 ? "melodic opening" : index === 1 ? "rhythmic setup" : "full band entry";
  if (name.startsWith("Verse")) return "song story";
  if (name === "Chorus") return "main hook";
  if (name === "Bridge") return "contrast";
  if (name.startsWith("Fill")) return "transition";
  if (name === "Break") return "short stop";
  return "ending cadence";
}

function sectionEnergy(name, index) {
  if (name.includes("Intro 1") || name.includes("Verse A")) return 1;
  if (name.includes("Intro 2") || name.includes("Verse B") || name.includes("Bridge") || name === "Break") return 2;
  if (name.includes("Intro 3") || name.includes("Chorus") || name.startsWith("Fill")) return 3;
  if (name.includes("Ending 3")) return 4;
  return Math.min(4, Math.max(1, (index % 4) + 1));
}

function buildSongPreviewHtml(project) {
  const rows = project.sectionTimeline.map((row) => `<tr><td>${row.barRange}</td><td>${row.section}</td><td>${row.durationBars}</td><td>${row.chordTimeline.join(" - ")}</td><td>${row.fillBeforeTransition}</td><td>${row.endingSelection}</td><td>${row.variationIntensity}</td><td>${Object.entries(row.trackActivity).map(([k,v]) => `${k}: ${v}`).join("<br>")}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${project.analysis.title} - UAOS Sequencer</title><style>body{font-family:Arial;background:#101827;color:#f8fafc;padding:24px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #334155;padding:8px;vertical-align:top}th{background:#172033}.safe{color:#86efac;font-weight:bold}</style></head><body><h1>${project.analysis.title}</h1><p class="safe">Demo MIDI/JSON only. Real keyboard writer remains blocked.</p><table><thead><tr><th>Bars</th><th>Section</th><th>Duration</th><th>Chord timeline</th><th>Fill</th><th>Ending</th><th>Variation</th><th>Track activity</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function buildSongMarkdown(project) {
  return `# ${project.analysis.title} - UAOS Arranger Summary

Style: ${project.analysis.genre}
Tempo: ${project.analysis.tempo} BPM
Key/Maqam: ${project.analysis.key}
Mood: ${project.analysis.mood}

## Arrangement Plan

${project.analysis.arrangementPlan}

## Safety

- Internal UAOS demo project only.
- Real keyboard writer remains blocked.
- No real keyboard output.
- No .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output.
`;
}

function buildDemoMidi(project) {
  const ticksPerQuarter = 480;
  const ticksPerBar = ticksPerQuarter * 4;
  const tempo = Math.round(60000000 / project.analysis.tempo);
  const events = [
    { tick: 0, bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255] },
    { tick: 0, bytes: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08] },
  ];

  gmTrackMap.forEach((track) => {
    if (track.channel !== 9) {
      events.push({ tick: 0, bytes: [0xc0 + track.channel, track.program] });
    }
  });

  project.sequencerGrid.forEach((row) => {
    const tick = (row.bar - 1) * ticksPerBar;
    const duration = row.section.startsWith("Fill") ? ticksPerQuarter : ticksPerQuarter * 2;
    gmTrackMap.forEach((track, index) => {
      const note = track.baseNote + ((row.energyLevel + index + row.bar) % 12);
      const velocity = Math.min(112, 52 + row.energyLevel * 12);
      const offset = index * 30;
      events.push({ tick: tick + offset, bytes: [0x90 + track.channel, note, velocity] });
      events.push({ tick: tick + offset + duration, bytes: [0x80 + track.channel, note, 0] });
    });
  });

  events.sort((a, b) => a.tick - b.tick);
  let lastTick = 0;
  const trackBytes = [];
  events.forEach((event) => {
    trackBytes.push(...variableLength(event.tick - lastTick), ...event.bytes);
    lastTick = event.tick;
  });
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  return new Uint8Array([
    ...ascii("MThd"), 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01, (ticksPerQuarter >> 8) & 255, ticksPerQuarter & 255,
    ...ascii("MTrk"), ...u32(trackBytes.length), ...trackBytes,
  ]);
}

function ascii(text) {
  return Array.from(text).map((char) => char.charCodeAt(0));
}

function u32(value) {
  return [(value >> 24) & 255, (value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function variableLength(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function agentReply(input) {
  const text = input.toLowerCase();

  if (text.includes("friend")) {
    return "For friend support: explain that UAOS is a serious local music workstation prototype, show the demo mode, and mention that your main current need is a stronger laptop for development, presentation, and testing.";
  }

  if (text.includes("jobcenter")) {
    return "For Jobcenter: present UAOS as a local prototype, explain what is already built, and clearly state that a stronger laptop or work computer is required as necessary work equipment.";
  }

  if (text.includes("laptop") || text.includes("computer")) {
    return "Your strongest support point is that the current computer slows development, builds, demos, and tests. A stronger laptop is not luxury here — it is essential work equipment.";
  }

  if (text.includes("music") || text.includes("project")) {
    return "Start by creating or opening a project, then generate the arrangement, review sections and tracks, save it, and export a safe summary.";
  }

  if (text.includes("marriage") || text.includes("wedding") || text.includes("love")) {
    return "On relationships, I suggest clarity and honesty first. If you want, I can help you write a thoughtful message or think through priorities before making decisions.";
  }

  if (text.includes("death") || text.includes("fear")) {
    return "If you are thinking about fear, death, or heavy life questions, I can stay with you calmly and help you think step by step. I am not a human being, but I can still help you reflect and organize your thoughts safely.";
  }

  return "I can help with UAOS, friend support, Jobcenter preparation, laptop funding explanation, music workflow, and thoughtful life questions in a calm safe way.";
}

export default function App() {
  const initialTemplate = templates[0];
  const initialProject = createProject(initialTemplate);

  const [projects, setProjects] = useState(() => {
    const existing = readProjects();
    return existing.length ? existing : [initialProject];
  });

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem(ACTIVE_KEY) || readProjects()[0]?.id || initialProject.id;
  });

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0] || initialProject,
    [projects, activeProjectId]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState(activeProject.templateId);
  const [title, setTitle] = useState(activeProject.title);
  const [message, setMessage] = useState("Ready");
  const [playing, setPlaying] = useState(false);
  const [selectedSectionName, setSelectedSectionName] = useState(activeProject.sections[0]?.name || "Intro");
  const [assistantName] = useState("UAOS Pixi");
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantVoiceOn, setAssistantVoiceOn] = useState(true);
  const [songInput, setSongInput] = useState({
    title: "Oriental Pop Song",
    reference: "",
    tempo: "",
    key: "",
    mood: "",
    style: "Oriental",
  });
  const [songArrangerProject, setSongArrangerProject] = useState(() =>
    createSongArrangerProject({
      title: "Oriental Pop Song",
      reference: "",
      tempo: "",
      key: "",
      mood: "",
      style: "Oriental",
    })
  );
  const [songGridOpen, setSongGridOpen] = useState(true);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: "assistant",
      text: "Hello, I am UAOS Pixi. I can help you with your music project, friend support, Jobcenter preparation, and calm life questions.",
    },
  ]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeProject.id);
  }, [activeProject.id]);

  const arrangement = useMemo(() => buildArrangement(activeProject), [activeProject]);

  const selectedSection =
    arrangement.find((section) => section.name === selectedSectionName) || arrangement[0];

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) || templates[0];

  const checklist = [
    { label: "Project", done: Boolean(activeProject.title) },
    { label: "Tracks", done: activeProject.enabledTracks.length > 0 },
    { label: "Arrangement", done: Boolean(activeProject.generatedAt) },
    { label: "Saved", done: Boolean(activeProject.savedAt) },
    { label: "Export", done: Boolean(activeProject.generatedAt) },
  ];

  const completionScore = Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100
  );

  const managerReadiness = 90;
  const blockedFinalItems = [
    "Real device writer",
    "Real keyboard output",
    "Commercial final writer claim",
  ];

  function persist(nextProjects, nextActiveId) {
    setProjects(nextProjects);
    writeProjects(nextProjects);
    localStorage.setItem(ACTIVE_KEY, nextActiveId);
    setActiveProjectId(nextActiveId);
  }

  function updateProject(patch) {
    const now = new Date().toISOString();
    const nextProjects = projects.map((project) =>
      project.id === activeProject.id ? { ...project, ...patch, updatedAt: now } : project
    );
    persist(nextProjects, activeProject.id);
  }

  function createNewProject() {
    const created = createProject(selectedTemplate, title.trim() || selectedTemplate.name);
    const nextProjects = [created, ...projects];
    persist(nextProjects, created.id);
    setTitle(created.title);
    setSelectedSectionName(created.sections[0]?.name || "Intro");
    setMessage("New project created");
  }

  function saveProject() {
    updateProject({ savedAt: new Date().toISOString() });
    setMessage("Project saved locally");
  }

  function generateProject() {
    updateProject({ generatedAt: new Date().toISOString() });
    setMessage("Arrangement generated");
  }

  function exportSummary() {
    const data = {
      product: "UAOS",
      version: "V8 Unified Action Bar + Pixi Assistant",
      title: activeProject.title,
      template: activeProject.templateName,
      bpm: activeProject.bpm,
      key: activeProject.key,
      groove: activeProject.groove,
      completionScore, managerReadiness, blockedFinalItems,
      tracks: activeProject.enabledTracks,
      sections: arrangement,
      safety: {
        publicPublish: false,
        deviceWriter: false,
        keyboardOutput: false,
        localOnly: true,
      },
    };
    downloadJson(`${cleanFilename(activeProject.title)}_uaos_v8_summary.json`, data);
    setMessage("Summary exported");
  }

  function updateSongInput(field, value) {
    setSongInput((current) => ({ ...current, [field]: value }));
  }

  function generateSongArrangerProject() {
    const next = createSongArrangerProject(songInput);
    setSongArrangerProject(next);
    setSongGridOpen(true);
    setMessage("Song arranger project generated");
  }

  function exportSongDemoProject() {
    downloadJson(`${cleanFilename(songArrangerProject.analysis.title)}_uaos_arranger_project.json`, songArrangerProject);
    setMessage("Song arranger JSON exported");
  }

  function exportSongPreview() {
    downloadTextFile(
      `${cleanFilename(songArrangerProject.analysis.title)}_sequencer_preview.html`,
      buildSongPreviewHtml(songArrangerProject),
      "text/html;charset=utf-8"
    );
    setMessage("Sequencer preview exported");
  }

  function exportSongMarkdown() {
    downloadTextFile(
      `${cleanFilename(songArrangerProject.analysis.title)}_arranger_summary.md`,
      buildSongMarkdown(songArrangerProject),
      "text/markdown;charset=utf-8"
    );
    setMessage("Markdown summary exported");
  }

  function exportSongMidi() {
    downloadBytes(`${cleanFilename(songArrangerProject.analysis.title)}_demo_v2.mid`, buildDemoMidi(songArrangerProject));
    setMessage("Demo MIDI exported");
  }

  function openFriendMode() {
    setMessage("Friend support mode ready");
    addAssistantSystemPrompt("Please help me explain UAOS to a friend who may support me financially.");
  }

  function openJobcenterMode() {
    setMessage("Jobcenter support mode ready");
    addAssistantSystemPrompt("Please help me prepare a Jobcenter explanation for UAOS and the need for a better laptop.");
  }

  function addAssistantSystemPrompt(text) {
    const reply = agentReply(text);
    const next = [
      ...assistantMessages,
      { role: "user", text },
      { role: "assistant", text: reply },
    ];
    setAssistantMessages(next);
    speakIfAllowed(reply);
  }

  function sendAssistantMessage() {
    const trimmed = assistantInput.trim();
    if (!trimmed) return;
    const reply = agentReply(trimmed);
    const next = [
      ...assistantMessages,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ];
    setAssistantMessages(next);
    setAssistantInput("");
    speakIfAllowed(reply);
  }

  function speakIfAllowed(text) {
    if (!assistantVoiceOn) return;
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function toggleTrack(trackId) {
    const exists = activeProject.enabledTracks.includes(trackId);
    const enabledTracks = exists
      ? activeProject.enabledTracks.filter((id) => id !== trackId)
      : [...activeProject.enabledTracks, trackId];

    updateProject({
      enabledTracks,
      generatedAt: null,
    });
    setMessage("Track selection updated");
  }

  function openProject(projectId) {
    const found = projects.find((p) => p.id === projectId);
    if (!found) return;
    setActiveProjectId(found.id);
    localStorage.setItem(ACTIVE_KEY, found.id);
    setTitle(found.title);
    setSelectedTemplateId(found.templateId);
    setSelectedSectionName(found.sections[0]?.name || "Intro");
    setMessage("Project opened");
  }

  return (
    <main className="uaos-v8-app">
      <aside className="uaos-v8-sidebar">
        <div className="uaos-v8-brand">
          <div className="uaos-v8-logo">U</div>
          <div>
            <strong>UAOS</strong>
            <span>Single-language workstation</span>
          </div>
        </div>

        <nav className="uaos-v8-nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#command-center">Command Center</a>
          <a href="#projects">Projects</a>
          <a href="#arranger">Arranger</a>
          <a href="#song-to-arranger">Song To Arranger</a>
          <a href="#owner-program">Owner Program</a>
          <a href="#assistant">Pixi Assistant</a>
          <a href="#send-ready">Send Ready</a>
          <a href="#export">Export</a>
        </nav>

        <div className="uaos-v8-safety">
          <strong>Safety gates</strong>
          <span>One language only</span>
          <span>No public publish</span>
          <span>No device writer</span>
          <span>Local workflow only</span>
        </div>
      </aside>

      <section className="uaos-v8-main">
        <section className="uaos-v8-topbar" id="dashboard">
          <div>
            <span>Active session</span>
            <strong>{activeProject.title}</strong>
          </div>
          <div className="uaos-v8-topbar-status">
            <b>{managerReadiness}% Manager Ready</b>
            <small>{message}</small>
          </div>
        </section>

        <section className="uaos-v8-hero">
          <div>
            <p className="uaos-v8-kicker">UAOS V8.1 Manager Ready</p>
            <h1>Unified Command Session</h1>
            <p>
              One clean language, one grouped action bar, and one living-style assistant shell
              inside the product experience.
            </p>
          </div>
          <div className="uaos-v8-readiness">
            <span>Manager status</span>
            <strong>{managerReadiness}% Ready</strong>
            <p>Demo, support packs, assistant, export, and presentation are ready. Final writer remains blocked for real-device testing.</p>
          </div>
        </section>

        <section className="uaos-v8-panel" id="local-project-status">
          <div className="uaos-v8-panel-header">
            <p>AE Platform / UAOS</p>
            <h2>Local Project Status</h2>
            <span>LOCAL ONLY · NOT PUBLIC RELEASE · GitHub transfer pending</span>
          </div>

          <div className="uaos-manager-ready-grid">
            <article>
              <strong>LOCAL ONLY</strong>
              <p>Owner dashboard, Jobcenter/supporter demo wording, and implementation queue are local/private planning materials.</p>
            </article>
            <article>
              <strong>NO PUSH / NO DEPLOY / NO VERCEL</strong>
              <p>Remote transfer is pending. Public release, hosting publication, and external automation remain blocked.</p>
            </article>
            <article>
              <strong>Blocked</strong>
              <p>Payment and real keyboard writer/export remain blocked. Demo wording is safe for Jobcenter/supporter explanation only.</p>
            </article>
          </div>
        </section>

        <section className="uaos-v8-panel" id="selected-neutral-package">
          <div className="uaos-v8-panel-header">
            <p>{selectedNeutralPackagePanel.safetyLabels.join(" · ")}</p>
            <h2>Selected Neutral Package</h2>
            <span>Owner manual review status only. No keyboard transfer, export, deploy, or payment action.</span>
          </div>

          <div className="uaos-manager-ready-grid">
            <article>
              <strong>Selected package</strong>
              <p>{selectedNeutralPackagePanel.selectedPackageId}</p>
            </article>
            <article>
              <strong>Package type</strong>
              <p>{selectedNeutralPackagePanel.packageType}</p>
            </article>
            <article>
              <strong>Keyboard-native</strong>
              <p>{selectedNeutralPackagePanel.keyboardNative}</p>
            </article>
            <article>
              <strong>Compatibility</strong>
              <p>{selectedNeutralPackagePanel.compatibility}</p>
            </article>
            <article>
              <strong>Real keyboard output</strong>
              <p>{selectedNeutralPackagePanel.realKeyboardOutput}</p>
            </article>
            <article>
              <strong>Keyboard transfer</strong>
              <p>{selectedNeutralPackagePanel.keyboardTransfer}</p>
            </article>
            <article>
              <strong>Validation</strong>
              <p>{selectedNeutralPackagePanel.validationStatus}</p>
            </article>
            <article>
              <strong>Review status</strong>
              <p>{selectedNeutralPackagePanel.reviewStatus}</p>
            </article>
            <article>
              <strong>Safe next action</strong>
              <p>{selectedNeutralPackagePanel.safeNextAction}</p>
            </article>
          </div>
        </section>

        <section className="uaos-v8-panel" id="owner-review-map">
          <div className="uaos-v8-panel-header">
            <p>Owner Review</p>
            <h2>Safe Local Review Map</h2>
            <span>Local-only checkpoints for private review. No public URLs, release, payment, or export claims.</span>
          </div>

          <div className="uaos-manager-ready-grid">
            <article>
              <strong>Owner Review</strong>
              <p>Review the local dashboard and reports before any next bounded task.</p>
            </article>
            <article>
              <strong>Jobcenter Pack</strong>
              <p>Use private prototype wording only: LOCAL ONLY, NOT PUBLIC RELEASE.</p>
            </article>
            <article>
              <strong>Supporter Pack</strong>
              <p>Share only private explanation material; no production, payment, or export readiness claims.</p>
            </article>
            <article>
              <strong>Demo Gateway</strong>
              <p>Static/local screenshot reference only. No deploy, Vercel, or public URL creation.</p>
            </article>
            <article>
              <strong>GitHub Transfer Wait Gate</strong>
              <p>Remote transfer is pending; current origin remains unchanged until owner approval.</p>
            </article>
            <article>
              <strong>Next Safe Task</strong>
              <p>Plan the next bounded local task with backup, checks, and safety gates first.</p>
            </article>
          </div>
        </section>

        
        <section className="uaos-v8-panel" id="manager-readiness">
          <div className="uaos-v8-panel-header">
            <p>Manager View</p>
            <h2>Manager Readiness</h2>
            <span>This separates product-demo readiness from the active project session checklist.</span>
          </div>

          <div className="uaos-manager-ready-grid">
            <article>
              <strong>90%</strong>
              <p>Presentation / support / demo readiness</p>
            </article>
            <article>
              <strong>Ready</strong>
              <p>Unified UI, Command Center, Pixi Assistant, Friend/Jobcenter flow, safe export.</p>
            </article>
            <article>
              <strong>Blocked</strong>
              <p>Final writer and real keyboard output remain blocked until real hardware testing.</p>
            </article>
          </div>
        </section>

        <section className="uaos-v8-panel" id="command-center">
          <div className="uaos-v8-panel-header">
            <p>Action Bar</p>
            <h2>Command Center</h2>
            <span>All main actions grouped together in one place.</span>
          </div>

          <div className="uaos-v8-command-bar">
            <button onClick={createNewProject}>New Project</button>
            <button onClick={saveProject}>Save</button>
            <button onClick={generateProject}>Generate</button>
            <button onClick={generateSongArrangerProject}>Generate Arranger Project</button>
            <button onClick={openFriendMode}>Friend</button>
            <button onClick={openJobcenterMode}>Jobcenter</button>
            <button onClick={exportSummary}>Export</button>
            <button className="primary" onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play"}
            </button>
          </div>

          <div className="uaos-v8-checklist">
            {checklist.map((item) => (
              <div key={item.label} className={item.done ? "done" : ""}>
                <span>{item.done ? "✓" : "•"}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="uaos-v8-panel uaos-song-arranger" id="song-to-arranger">
          <div className="uaos-v8-panel-header">
            <p>Song To Arranger</p>
            <h2>Song To Arranger Sequencer MVP</h2>
            <span>Write a song name or idea. UAOS builds an internal arranger project with sections, tracks, variations, sequencer grid, and safe demo exports.</span>
          </div>

          <div className="uaos-song-form">
            <label>
              Song name
              <input value={songInput.title} onChange={(e) => updateSongInput("title", e.target.value)} placeholder="Song name or idea" />
            </label>
            <label>
              Reference style
              <input value={songInput.reference} onChange={(e) => updateSongInput("reference", e.target.value)} placeholder="Optional artist/style reference" />
            </label>
            <label>
              Tempo
              <input value={songInput.tempo} onChange={(e) => updateSongInput("tempo", e.target.value)} placeholder="Optional BPM" inputMode="numeric" />
            </label>
            <label>
              Key / Maqam
              <input value={songInput.key} onChange={(e) => updateSongInput("key", e.target.value)} placeholder="Optional key or maqam" />
            </label>
            <label>
              Mood
              <input value={songInput.mood} onChange={(e) => updateSongInput("mood", e.target.value)} placeholder="Optional mood" />
            </label>
            <label>
              Target style
              <select value={songInput.style} onChange={(e) => updateSongInput("style", e.target.value)}>
                {Object.keys(songStyles).map((style) => <option key={style}>{style}</option>)}
              </select>
            </label>
          </div>

          <div className="uaos-song-actions">
            <button onClick={generateSongArrangerProject}>Generate Arranger Project</button>
            <button onClick={() => setSongGridOpen(!songGridOpen)}>Open Sequencer Grid</button>
            <button onClick={exportSongMidi}>Export Demo MIDI</button>
            <button onClick={exportSongDemoProject}>Export Demo Project</button>
            <button onClick={exportSongPreview}>Export HTML Preview</button>
            <button onClick={exportSongMarkdown}>Export Markdown Summary</button>
          </div>

          <p className="uaos-song-safety">
            Demo MIDI only. Real keyboard writer remains blocked. JSON/HTML/Markdown exports are internal UAOS demo artifacts.
          </p>

          <div className="uaos-song-analysis">
            <article><span>Song title</span><strong>{songArrangerProject.analysis.title}</strong></article>
            <article><span>Inferred genre/style</span><strong>{songArrangerProject.analysis.genre}</strong></article>
            <article><span>Suggested tempo</span><strong>{songArrangerProject.analysis.tempo} BPM</strong></article>
            <article><span>Suggested key/maqam</span><strong>{songArrangerProject.analysis.key}</strong></article>
            <article><span>Mood</span><strong>{songArrangerProject.analysis.mood}</strong></article>
            <article><span>Arrangement plan</span><strong>{songArrangerProject.analysis.arrangementPlan}</strong></article>
          </div>

          <div className="uaos-song-panels">
            <article>
              <h3>Arranger Sections</h3>
              <div className="uaos-song-list">
                {songArrangerProject.sections.map((section) => (
                  <span key={section.name}>{section.name} · bars {section.startBar}-{section.endBar}</span>
                ))}
              </div>
            </article>
            <article>
              <h3>Tracks</h3>
              <div className="uaos-song-list">
                {songArrangerProject.tracks.map((track) => (
                  <span key={track.name}>{track.name} · {track.role}</span>
                ))}
              </div>
            </article>
            <article>
              <h3>Style Variations</h3>
              <div className="uaos-song-list">
                {songArrangerProject.variations.map((variation) => (
                  <span key={variation.name}>{variation.name} · {variation.energy}</span>
                ))}
              </div>
            </article>
          </div>

          {songGridOpen && (
            <div className="uaos-song-grid-wrap">
              <h3>Sequencer Grid</h3>
              <div className="uaos-song-grid">
                <div className="head">Bars</div>
                <div className="head">Section</div>
                <div className="head">Duration</div>
                <div className="head">Chord timeline</div>
                <div className="head">Fill</div>
                <div className="head">Ending</div>
                <div className="head">Variation intensity</div>
                <div className="head">Track activity</div>
                {songArrangerProject.sectionTimeline.map((row) => (
                  <React.Fragment key={`${row.barRange}-${row.section}`}>
                    <div>{row.barRange}</div>
                    <div>{row.section}</div>
                    <div>{row.durationBars} bars</div>
                    <div>{row.chordTimeline.join(" - ")}</div>
                    <div>{row.fillBeforeTransition}</div>
                    <div>{row.endingSelection}</div>
                    <div>{row.variationIntensity}</div>
                    <div>{Object.entries(row.trackActivity).map(([track, activity]) => `${track}: ${activity}`).join(" | ")}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="uaos-song-playback">
            <h3>Demo Playback Plan</h3>
            <div className="uaos-song-list">
              {songArrangerProject.playbackPlan.timeline.map((item) => (
                <span key={`${item.bar}-${item.section}`}>Bar {item.bar}: {item.section} · {songArrangerProject.playbackPlan.bpm} BPM · {item.transition}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="uaos-v8-panel uaos-owner-program-panel" id="owner-program">
          <div className="uaos-v8-panel-header">
            <p>Relaxed Product Mode</p>
            <h2>Final Owner Program Integration</h2>
            <span>React UI integration is allowed for this requested local build. Writer, USB, PA3X, push, and deploy actions remain blocked.</span>
          </div>

          <div className="uaos-owner-safety-strip">
            {ownerSafetyGates.map((gate) => (
              <strong key={gate}>{gate}</strong>
            ))}
          </div>

          <div className="uaos-owner-program-grid">
            {ownerProgramSections.map((section) => (
              <article key={section.title}>
                <div>
                  <span>{section.status}</span>
                  <h3>{section.title}</h3>
                </div>
                <p>{section.ownerTest}</p>
                <small>{section.localPath}</small>
                <b>{section.blocked}</b>
              </article>
            ))}
          </div>
        </section>

        <section className="uaos-v8-grid">
          <section className="uaos-v8-panel" id="projects">
            <div className="uaos-v8-panel-header">
              <p>Projects</p>
              <h2>Project Setup</h2>
              <span>Create and manage your current working arrangement.</span>
            </div>

            <div className="uaos-v8-form">
              <label>
                Project title
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>

              <label>
                Template
                <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="uaos-v8-project-list">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={project.id === activeProject.id ? "active" : ""}
                  onClick={() => openProject(project.id)}
                >
                  <strong>{project.title}</strong>
                  <span>{project.templateName}</span>
                  <small>{project.bpm} BPM · {project.key}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="uaos-v8-panel" id="arranger">
            <div className="uaos-v8-panel-header">
              <p>Arranger</p>
              <h2>Sections and Tracks</h2>
              <span>Review arrangement sections and enable or mute tracks.</span>
            </div>

            <div className="uaos-v8-sections">
              {arrangement.map((section) => (
                <button
                  key={section.name}
                  className={selectedSectionName === section.name ? "active" : ""}
                  onClick={() => setSelectedSectionName(section.name)}
                >
                  <strong>{section.name}</strong>
                  <span>{section.bars} bars</span>
                  <small>{section.energy}%</small>
                </button>
              ))}
            </div>

            <div className="uaos-v8-section-detail">
              <strong>{selectedSection?.name}</strong>
              <p>{selectedSection?.chord}</p>
              <span>{selectedSection?.cue}</span>
            </div>

            <div className="uaos-v8-tracks">
              {trackRoles.map((track) => {
                const active = activeProject.enabledTracks.includes(track.id);
                return (
                  <button
                    key={track.id}
                    className={active ? "active" : ""}
                    onClick={() => toggleTrack(track.id)}
                  >
                    <strong>{track.name}</strong>
                    <small>{track.pattern}</small>
                  </button>
                );
              })}
            </div>
          </section>
        </section>

        <section className="uaos-v8-panel" id="assistant">
          <div className="uaos-v8-panel-header">
            <p>Assistant</p>
            <h2>{assistantName}</h2>
            <span>A living-style in-app assistant shell for project help, support preparation, and calm questions.</span>
          </div>

          <div className="uaos-v8-assistant-shell">
            <div className="uaos-v8-assistant-head">
              <div className="uaos-v8-avatar">P</div>
              <div>
                <strong>{assistantName}</strong>
                <small>Voice enabled: {assistantVoiceOn ? "On" : "Off"}</small>
              </div>
              <button onClick={() => setAssistantVoiceOn(!assistantVoiceOn)}>
                {assistantVoiceOn ? "Mute Voice" : "Enable Voice"}
              </button>
            </div>

            <div className="uaos-v8-assistant-quick">
              <button onClick={() => addAssistantSystemPrompt("Help me prepare a friend support message.")}>Friend Help</button>
              <button onClick={() => addAssistantSystemPrompt("Help me prepare a Jobcenter explanation.")}>Jobcenter Help</button>
              <button onClick={() => addAssistantSystemPrompt("Why do I need a stronger laptop?")}>Laptop Need</button>
              <button onClick={() => addAssistantSystemPrompt("Help me plan my music project.")}>Music Plan</button>
              <button onClick={() => addAssistantSystemPrompt("I want to think about fear, death, or life questions.")}>Life Questions</button>
            </div>

            <div className="uaos-v8-chat">
              {assistantMessages.map((item, index) => (
                <div key={index} className={item.role === "assistant" ? "assistant" : "user"}>
                  <span>{item.role === "assistant" ? assistantName : "You"}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>

            <div className="uaos-v8-chat-input">
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Ask Pixi about UAOS, support, laptop funding, music workflow, or life questions..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendAssistantMessage();
                }}
              />
              <button onClick={sendAssistantMessage}>Send</button>
            </div>
          </div>
        </section>

        
        <section className="uaos-v8-panel" id="send-ready">
          <div className="uaos-v8-panel-header">
            <p>Send Ready</p>
            <h2>Send Ready Selector</h2>
            <span>Choose exactly what to send to a friend, Jobcenter, or full reviewer.</span>
          </div>

          <div className="uaos-send-ready-grid">
            <article>
              <strong>Friend</strong>
              <p>Use the Friend Support Pack for quick private review and possible personal support.</p>
              <small>Send: Friend Support ZIP</small>
            </article>

            <article>
              <strong>Jobcenter</strong>
              <p>Use the Jobcenter Pack for funding, Arbeitsmittel, and laptop/work-computer support.</p>
              <small>Send: Jobcenter Support ZIP</small>
            </article>

            <article>
              <strong>Master Review</strong>
              <p>Use the Master Pack when someone needs the complete picture of UAOS.</p>
              <small>Send: Master Final Prep ZIP</small>
            </article>
          </div>
        </section>

        <section className="uaos-v8-panel" id="export">
          <div className="uaos-v8-panel-header">
            <p>Export</p>
            <h2>Safe Export Center</h2>
            <span>Export safe local summary files only.</span>
          </div>

          <div className="uaos-v8-export-row">
            <article>
              <strong>Summary JSON</strong>
              <p>Exports a safe local project summary.</p>
              <button onClick={exportSummary}>Download Summary</button>
            </article>

            <article>
              <strong>Friend / Jobcenter flow</strong>
              <p>Use the action bar or Pixi quick prompts to prepare support explanations.</p>
            </article>

            <article>
              <strong>Writer status</strong>
              <p>Still blocked. No public publish, no device writer, no real keyboard output.</p>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}


