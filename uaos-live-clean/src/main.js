const API = "";
let current = null;
let playing = false;
let timers = [];

async function getJson(path, body) {
  const res = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function log(m) {
  logs.innerHTML = `<div>${new Date().toLocaleTimeString()} ${m}</div>` + logs.innerHTML;
}

function hz(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function stop() {
  playing = false;
  timers.forEach(clearTimeout);
  timers = [];
  log("Stopped");
}

function playPattern(pattern) {
  stop();
  playing = true;
  const ctx = new AudioContext();
  const beatMs = 60000 / pattern.tempo;

  for (const n of pattern.notes) {
    const id = setTimeout(() => {
      if (!playing) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.channel === 9 ? "square" : n.role === "bass" ? "triangle" : "sine";
      osc.frequency.value = n.channel === 9 ? (n.note === 36 ? 70 : 140) : hz(n.note);
      gain.gain.value = (n.velocity || 90) / (n.channel === 9 ? 850 : 1100);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + Math.max(0.05, (n.duration || 120) / 1000));
    }, n.time * beatMs / 480);
    timers.push(id);
  }

  log("Playing " + pattern.name);
}

function body() {
  return {
    tempo: Number(tempo.value),
    section: section.value,
    chord: chord.value,
    maqam: maqam.value
  };
}

async function status() {
  const r = await getJson("/api/status");
  out.textContent = JSON.stringify(r, null, 2);
  log("Status OK");
}

async function presets() {
  const r = await getJson("/api/presets");
  out.textContent = JSON.stringify(r, null, 2);
  log("Presets loaded");
}

async function generate() {
  current = await getJson("/api/song-generate", body());
  out.textContent = JSON.stringify(current, null, 2);
  monitor.textContent = current.notes.map(n => `${n.time} CH${n.channel} NOTE ${n.note} VEL ${n.velocity} ${n.role}`).join("\n");
  log("Generated " + current.name);
}

async function play() {
  if (!current) await generate();
  playPattern(current);
}

async function downloadMidi() {
  const res = await fetch("/api/midi-export", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body())
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "uaos-public-style.mid";
  a.click();
  URL.revokeObjectURL(url);
  log("MIDI downloaded");
}

document.querySelector("#app").innerHTML = `
  <div class="hero">
    <h1>UAOS HyperStation Public Live</h1>
    <p>Live arranger, public API, audio test, and MIDI export.</p>
    <div class="badges"><span>Public</span><span>Vercel API</span><span>MIDI Export</span><span>Audio Test</span></div>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Live Arranger</h2>
      <label>Section</label>
      <select id="section">
        <option>Intro</option><option selected>Main A</option><option>Main B</option><option>Fill</option><option>Break</option><option>Ending</option>
      </select>

      <label>Chord</label>
      <select id="chord">
        <option>Cm</option><option>Dm</option><option>G7</option><option>F</option><option>Bb</option><option>Am</option>
      </select>

      <label>Maqam</label>
      <select id="maqam">
        <option>Nahawand</option><option>Bayati</option><option>Hijaz</option><option>Rast</option><option>Saba</option><option>Kurd</option>
      </select>

      <label>Tempo: <span id="tempoLabel">96</span></label>
      <input id="tempo" type="range" min="60" max="160" value="96"/>

      <button id="statusBtn">Check Status</button>
      <button id="presetsBtn">Load Presets</button>
      <button id="generateBtn">Generate Style</button>
      <button id="playBtn">Play</button>
      <button id="stopBtn">Stop</button>
      <button id="midiBtn">Download MIDI</button>
    </div>

    <div class="card">
      <h2>Output</h2>
      <pre id="out">Ready.</pre>
    </div>

    <div class="card">
      <h2>MIDI Monitor</h2>
      <pre id="monitor"></pre>
    </div>

    <div class="card">
      <h2>Log</h2>
      <div id="logs"></div>
    </div>
  </div>
`;

tempo.oninput = () => tempoLabel.textContent = tempo.value;
statusBtn.onclick = status;
presetsBtn.onclick = presets;
generateBtn.onclick = generate;
playBtn.onclick = play;
stopBtn.onclick = stop;
midiBtn.onclick = downloadMidi;
