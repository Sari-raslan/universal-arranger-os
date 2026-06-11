const API = "";

async function getJson(path, body) {
  const res = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function playNotes(notes, tempo) {
  const ctx = new AudioContext();
  for (const n of notes) {
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440 * Math.pow(2, (n.note - 69) / 12);
      gain.gain.value = (n.velocity || 90) / 900;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }, n.time * (60000 / tempo) / 480);
  }
}

document.querySelector("#app").innerHTML = `
  <div class="hero">
    <h1>UAOS HyperStation Public Live</h1>
    <p>AEPlatform public app fixed: frontend + Vercel API + audio test.</p>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Controls</h2>
      <button id="statusBtn">Check Status</button>
      <button id="presetsBtn">Load Presets</button>
      <button id="generateBtn">Generate Pattern</button>
      <button id="playBtn">Play Audio Test</button>
    </div>

    <div class="card">
      <h2>Output</h2>
      <pre id="out">Ready.</pre>
    </div>
  </div>
`;

let current = null;

statusBtn.onclick = async () => {
  current = await getJson("/api/status");
  out.textContent = JSON.stringify(current, null, 2);
};

presetsBtn.onclick = async () => {
  current = await getJson("/api/presets");
  out.textContent = JSON.stringify(current, null, 2);
};

generateBtn.onclick = async () => {
  current = await getJson("/api/song-generate", { tempo: 96, maqam: "Nahawand", chord: "Cm" });
  out.textContent = JSON.stringify(current, null, 2);
};

playBtn.onclick = async () => {
  if (!current || !current.notes) {
    current = await getJson("/api/song-generate", { tempo: 96 });
    out.textContent = JSON.stringify(current, null, 2);
  }
  playNotes(current.notes, current.tempo || 96);
};
