(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``,t=null,n=!1,r=[];async function i(t,n){let r=await fetch(e+t,{method:n?`POST`:`GET`,headers:{"Content-Type":`application/json`},body:n?JSON.stringify(n):void 0});if(!r.ok)throw Error(await r.text());return r.json()}function a(e){logs.innerHTML=`<div>${new Date().toLocaleTimeString()} ${e}</div>`+logs.innerHTML}function o(e){return 440*2**((e-69)/12)}function s(){n=!1,r.forEach(clearTimeout),r=[],a(`Stopped`)}function c(e){s(),n=!0;let t=new AudioContext,i=6e4/e.tempo;for(let a of e.notes){let e=setTimeout(()=>{if(!n)return;let e=t.createOscillator(),r=t.createGain();e.type=a.channel===9?`square`:a.role===`bass`?`triangle`:`sine`,e.frequency.value=a.channel===9?a.note===36?70:140:o(a.note),r.gain.value=(a.velocity||90)/(a.channel===9?850:1100),e.connect(r).connect(t.destination),e.start(),e.stop(t.currentTime+Math.max(.05,(a.duration||120)/1e3))},a.time*i/480);r.push(e)}a(`Playing `+e.name)}function l(){return{tempo:Number(tempo.value),section:section.value,chord:chord.value,maqam:maqam.value}}async function u(){let e=await i(`/api/status`);out.textContent=JSON.stringify(e,null,2),a(`Status OK`)}async function d(){let e=await i(`/api/presets`);out.textContent=JSON.stringify(e,null,2),a(`Presets loaded`)}async function f(){t=await i(`/api/song-generate`,l()),out.textContent=JSON.stringify(t,null,2),monitor.textContent=t.notes.map(e=>`${e.time} CH${e.channel} NOTE ${e.note} VEL ${e.velocity} ${e.role}`).join(`
`),a(`Generated `+t.name)}async function p(){t||await f(),c(t)}async function m(){let e=await(await fetch(`/api/midi-export`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(l())})).blob(),t=URL.createObjectURL(e),n=document.createElement(`a`);n.href=t,n.download=`uaos-public-style.mid`,n.click(),URL.revokeObjectURL(t),a(`MIDI downloaded`)}document.querySelector(`#app`).innerHTML=`
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
`,tempo.oninput=()=>tempoLabel.textContent=tempo.value,statusBtn.onclick=u,presetsBtn.onclick=d,generateBtn.onclick=f,playBtn.onclick=p,stopBtn.onclick=s,midiBtn.onclick=m;