const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const port = Number(process.env.PORT || 5199);
const version = "1.0.0";
const dataDir = path.join(__dirname, "data");
const uploadsDir = path.join(__dirname, "uploads");
const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5180",
  "http://localhost:5180"
]);

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: "25mb" }));
app.use("/samples", express.static(uploadsDir));

const sampleMapFile = path.join(dataDir, "sample-map.json");
const projectsFile = path.join(dataDir, "projects.json");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

if (!fs.existsSync(sampleMapFile)) writeJson(sampleMapFile, []);
if (!fs.existsSync(projectsFile)) writeJson(projectsFile, []);

const presets = [
  { name: "Khaliji Pop 96", tempo: 96, maqam: "Nahawand", section: "VAR_A", chord: "Cm" },
  { name: "Oriental Ballad 76", tempo: 76, maqam: "Bayati", section: "VAR_B", chord: "Dm" },
  { name: "Hijaz Dance 112", tempo: 112, maqam: "Hijaz", section: "FILL_1", chord: "G7" }
];

const chords = {
  C: [60, 64, 67],
  Cm: [60, 63, 67],
  Dm: [62, 65, 69],
  G7: [67, 71, 74, 77],
  F: [65, 69, 72],
  Bb: [70, 74, 77],
  Am: [69, 72, 76]
};

function makePattern(body = {}) {
  const tempo = Math.max(30, Math.min(260, Number(body.tempo || 96)));
  const chord = chords[body.chord] ? body.chord : "Cm";
  const maqam = String(body.maqam || "Nahawand");
  const structure = Array.isArray(body.structure) && body.structure.length ? body.structure : [body.section || "VAR_A"];
  const base = chords[chord];
  const notes = [];
  let position = 0;

  for (const section of structure) {
    for (let step = 0; step < 4; step += 1) {
      notes.push({ time: position + step * 480, duration: 360, note: base[step % base.length], velocity: 96 - (step % 3) * 6, channel: 0, role: "melody", section });
      notes.push({ time: position + step * 480 + 240, duration: 150, note: base[0] - 12, velocity: 75, channel: 1, role: "bass", section });
      notes.push({ time: position + step * 480, duration: 90, note: step % 2 ? 42 : 36, velocity: step % 2 ? 80 : 112, channel: 9, role: "drum", section });
    }
    if (section === "FILL_1" || section === "FILL_2") {
      [38, 40, 43, 45].forEach((note, index) => {
        notes.push({ time: position + 1440 + index * 90, duration: 70, note, velocity: 112, channel: 9, role: "fill", section });
      });
    }
    position += 1920;
  }

  return {
    ok: true,
    generator: "deterministic-v1-pattern",
    name: `UAOS ${structure[0]} ${chord} ${maqam}`,
    tempo,
    section: structure[0],
    chord,
    maqam,
    structure,
    timeline: Array.isArray(body.timeline) ? body.timeline : [],
    ppq: 480,
    notes
  };
}

function vlq(value) {
  const bytes = [value & 0x7f];
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return Buffer.from(bytes);
}

function midiEvent(delta, data) {
  return Buffer.concat([vlq(delta), Buffer.from(data)]);
}

function toMidi(pattern) {
  const mpqn = Math.round(60000000 / (pattern.tempo || 120));
  const events = [Buffer.from([0, 0xff, 0x51, 3, (mpqn >> 16) & 255, (mpqn >> 8) & 255, mpqn & 255])];
  const flat = [];

  for (const note of pattern.notes || []) {
    flat.push({ time: note.time, on: true, note: note.note, velocity: note.velocity || 100, channel: note.channel || 0 });
    flat.push({ time: note.time + note.duration, on: false, note: note.note, velocity: 0, channel: note.channel || 0 });
  }

  flat.sort((a, b) => a.time - b.time || Number(a.on) - Number(b.on));
  let last = 0;
  for (const event of flat) {
    events.push(midiEvent(Math.max(0, event.time - last), [event.on ? 0x90 + event.channel : 0x80 + event.channel, event.note, event.velocity]));
    last = event.time;
  }
  events.push(Buffer.from([0, 0xff, 0x2f, 0]));

  const body = Buffer.concat(events);
  const header = Buffer.alloc(14);
  header.write("MThd");
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(1, 10);
  header.writeUInt16BE(480, 12);

  const track = Buffer.alloc(8);
  track.write("MTrk");
  track.writeUInt32BE(body.length, 4);
  return Buffer.concat([header, track, body]);
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "uaos-v1-backend", mode: process.env.NODE_ENV || "development", time: new Date().toISOString() }));
app.get("/api/version", (_req, res) => res.json({ ok: true, version, api: "uaos-v1" }));
app.get("/api/status", (_req, res) => res.json({
  ok: true,
  product: "UAOS V1",
  version,
  mode: process.env.NODE_ENV || "development",
  features: { sampler: "planned", webmidi: "browser", timeline: "available", midiExport: "available", ai: "not included" }
}));
app.get("/api/presets", (_req, res) => res.json(presets));
app.post("/api/pattern-generate", (req, res) => res.json(makePattern(req.body || {})));
app.post("/api/midi-export", (req, res) => {
  const file = toMidi(makePattern(req.body || {}));
  res.setHeader("Content-Type", "audio/midi");
  res.setHeader("Content-Disposition", "attachment; filename=uaos-pattern.mid");
  res.send(file);
});
app.get("/api/sampler/map", (_req, res) => res.json(readJson(sampleMapFile, [])));
app.post("/api/sampler/map", (req, res) => {
  const map = Array.isArray(req.body) ? req.body : [];
  writeJson(sampleMapFile, map);
  res.json({ ok: true, count: map.length });
});
app.post("/api/samples/import", (req, res) => {
  const filename = String(req.body?.filename || "sample.wav").replace(/[^a-z0-9._-]/gi, "_");
  fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(req.body?.base64 || "", "base64"));
  res.json({ ok: true, file: filename, url: `/samples/${filename}` });
});
app.post("/api/project/save", (req, res) => {
  const projects = readJson(projectsFile, []);
  const project = { id: Date.now(), createdAt: new Date().toISOString(), ...req.body };
  projects.unshift(project);
  writeJson(projectsFile, projects);
  res.json({ ok: true, project });
});
app.get("/api/project/list", (_req, res) => res.json(readJson(projectsFile, [])));

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Unknown endpoint: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`UAOS V1 backend listening on http://127.0.0.1:${port}`);
  });
}

module.exports = { app, makePattern, toMidi };
