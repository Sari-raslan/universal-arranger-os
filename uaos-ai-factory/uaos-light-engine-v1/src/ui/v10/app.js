let effectsData = [];
let audioCtx, analyser, dataArray, source;
let lastFrameTime = 0;
const FRAME_MIN_TIME = 100;

async function hueAction(endpoint, method = 'POST', body = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = body;
  try {
    const res = await fetch(endpoint, options);
    return await res.json().catch(() => ({}));
  } catch (e) {
    console.error('Fetch error:', e);
    return { error: true };
  }
}

async function loadEffects() {
  try {
    const res = await fetch('/api/v10/effects/list');
    const data = await res.json();
    effectsData = data.items || data || [];
    renderGrids();
  } catch(e) {
    console.error('Effects load failed', e);
  }
}

function renderGrids() {
  const dash = document.getElementById('dashboard-grid');
  const full = document.getElementById('full-effects-grid');
  if (!dash || !full) return;

  dash.innerHTML = '';
  full.innerHTML = '';

  const items = Array.isArray(effectsData) ? effectsData : (effectsData.items || []);

  items.forEach(eff => {
    const btn = document.createElement('button');
    btn.className = 'eff-btn';
    btn.innerText = eff.name || eff.id;
    btn.onclick = () => runEffect(eff.id);
    full.appendChild(btn);

    if (eff.cat === 'STATIC' || eff.id === 'club' || eff.id === 'candle' || eff.id === 'fireplace') {
      const clone = btn.cloneNode(true);
      clone.onclick = () => runEffect(eff.id);
      dash.appendChild(clone);
    }
  });
}

function setPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('panel-' + id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (window.event && window.event.target) window.event.target.classList.add('active');
}

async function runEffect(id) {
  await hueAction('/api/v10/effects/run', 'POST', JSON.stringify({ id }));
  const label = document.getElementById('active-scene-name');
  if (label) label.innerText = String(id || '').toUpperCase();
}

async function initAudio(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let stream;

    if (type === 'mic') {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } else {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (!stream.getAudioTracks().length) {
        const err = document.getElementById('audio-error');
        if (err) err.innerText = 'System Audio: Use Microphone mode or share a Chrome tab with audio.';
        return;
      }
    }

    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    await hueAction('/api/v10/music/start', 'POST', JSON.stringify({ input: type, mode: 'music_party' }));
    requestAnimationFrame(musicLoop);
  } catch(e) {
    const err = document.getElementById('audio-error');
    if (err) err.innerText = 'Access Denied: ' + e.message;
  }
}

async function stopAudio() {
  try { if (source) source.disconnect(); } catch {}
  source = null;
  analyser = null;
  await hueAction('/api/v10/music/stop', 'POST', JSON.stringify({}));
  const err = document.getElementById('audio-error');
  if (err) err.innerText = '';
}

function musicLoop(time) {
  if (!analyser) return;
  requestAnimationFrame(musicLoop);

  if (time - lastFrameTime < FRAME_MIN_TIME) return;
  lastFrameTime = time;

  analyser.getByteFrequencyData(dataArray);
  const bass = (dataArray[2] || 0) / 255;
  const mid = (dataArray[10] || 0) / 255;
  const treble = (dataArray[30] || 0) / 255;
  const level = Math.min(1, (bass + mid + treble) / 3);
  const beat = bass > 0.72;

  const b = document.getElementById('v-bass');
  const m = document.getElementById('v-mid');
  const t = document.getElementById('v-treble');

  if (b) b.style.height = (bass * 100) + '%';
  if (m) m.style.height = (mid * 100) + '%';
  if (t) t.style.height = (treble * 100) + '%';

  fetch('/api/v10/music/frame', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode:'music_party', bass, mid, treble, level, beat, timestamp: Date.now() })
  });
}

function runDiag() {
  fetch('/api/v10/diagnostics/run').then(r => r.json()).then(d => {
    const out = document.getElementById('diag-output');
    if (out) out.innerText = JSON.stringify(d, null, 2);
  });
}

document.addEventListener('DOMContentLoaded', loadEffects);