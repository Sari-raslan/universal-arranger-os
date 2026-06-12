(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function e(e){let t=Array.isArray(e)?e:e?.samples;return Array.isArray(t)?t.map((e,t)=>{let n=e.url||(e.file?`/samples/${e.file}`:null);return n?{id:e.id||`sample-${t}`,name:e.name||e.file||`Sample ${t+1}`,url:n,rootNote:Number(e.rootNote??60),lowNote:Number(e.lowNote??0),highNote:Number(e.highNote??127),velocityMin:Number(e.velocityMin??1),velocityMax:Number(e.velocityMax??127),channel:e.channel==null?null:Number(e.channel),role:e.role||e.articulation||null}:null}).filter(Boolean):[]}function t(e,t,n=100,r=null,i=null){return e.find(e=>{let a=t>=e.lowNote&&t<=e.highNote,o=n>=e.velocityMin&&n<=e.velocityMax,s=e.channel==null||r==null||e.channel===r,c=!e.role||!i||e.role===i;return a&&o&&s&&c})||null}function n(e,t=60){return 2**((e-t)/12)}var r=[{section:`Intro`,bars:4},{section:`Main A`,bars:8},{section:`Fill`,bars:1},{section:`Main B`,bars:8},{section:`Ending`,bars:4}];function i(e){return(Array.isArray(e)&&e.length?e:r).map(e=>({section:String(e.section||`Main A`),bars:Math.max(1,Math.min(64,Number(e.bars??4)))}))}function a(e,t,n=4){return[...i(e),{section:String(t||`Main A`),bars:Math.max(1,Math.min(64,Number(n??4)))}]}function o(e,t){let n=i(e).filter((e,n)=>n!==t);return n.length?n:i(r)}function s(e){return i(e).map(e=>e.section)}function c(e){return e?.requestMIDIAccess?{supported:!0,label:`WebMIDI ready`}:{supported:!1,label:`WebMIDI unavailable`}}function l(e){return{inputs:[...e?.inputs?.values?.()||[]].map(e=>({id:e.id,name:e.name||`MIDI Input`,manufacturer:e.manufacturer||``,state:e.state||`unknown`})),outputs:[...e?.outputs?.values?.()||[]].map(e=>({id:e.id,name:e.name||`MIDI Output`,manufacturer:e.manufacturer||``,state:e.state||`unknown`}))}}function u(e=[]){let[t=0,n=0,r=0]=Array.from(e),i=t&240,a=(t&15)+1;return i===144&&r>0?`CH${a} NOTE ON ${n} VEL ${r}`:i===128||i===144?`CH${a} NOTE OFF ${n}`:i===176?`CH${a} CC ${n} VAL ${r}`:i===192?`CH${a} PROGRAM ${n}`:t===240||t===247?`SYSEX ${Array.from(e).length} bytes`:`MIDI ${Array.from(e).map(e=>e.toString(16).padStart(2,`0`)).join(` `)}`}var d=``,f=JSON.parse(localStorage.getItem(`uaos.settings`)||`{}`),p=null,m=!1,h=[],g=null,_=null,v=null,y=!1,b=[],x=!1,S=[],C=[],w=null,T=i(f.timeline||r);window.addEventListener(`beforeinstallprompt`,e=>{e.preventDefault(),g=e,document.querySelector(`#installBtn`)&&(installBtn.style.display=`inline-block`)});async function E(e,t){let n=await fetch(d+e,{method:t?`POST`:`GET`,headers:{"Content-Type":`application/json`},body:t?JSON.stringify(t):void 0});if(!n.ok)throw Error(await n.text());return n.json()}function D(){localStorage.setItem(`uaos.settings`,JSON.stringify({tempo:tempo.value,section:section.value,chord:chord.value,maqam:maqam.value,mode:mode.value,timeline:T}))}function O(e){let t=document.createElement(`div`);t.className=`log-row`,t.textContent=`${new Date().toLocaleTimeString()}  ${e}`,logs.prepend(t)}function k(e){let t=monitor.textContent?`${monitor.textContent}\n`:``;monitor.textContent=`${e}\n${t}`.split(`
`).slice(0,80).join(`
`)}function A(e=null){if(document.querySelector(`#midiState`)){if(!c(navigator).supported){midiState.textContent=`Unavailable`;return}if(!e){midiState.textContent=`Ready`;return}midiState.textContent=`${e.inputs.length} in / ${e.outputs.length} out`}}function j(e){return 440*2**((e-69)/12)}async function M(){_||=new(window.AudioContext||window.webkitAudioContext),_.state===`suspended`&&await Promise.race([_.resume().catch(()=>null),new Promise(e=>setTimeout(e,250))]),v||(v=_.createGain(),v.gain.value=.86,v.connect(_.destination))}function N(){if(document.querySelector(`#sampleState`)){if(S.length){sampleState.textContent=`${S.length} WAV ready`;return}sampleState.textContent=b.length?`${b.length} mapped`:`Synth fallback`}}async function P(){if(y)return b;y=!0;try{b=e(await E(`/api/sampler/map`)),N(),O(b.length?`Sampler map found ${b.length} WAV slots`:`No WAV samples mapped; synth fallback ready`)}catch{b=[],N(),O(`Sampler map unavailable; synth fallback ready`)}return b}async function F(){if(x)return;x=!0,await M();let e=await P(),t=[];for(let n of e)try{let e=await fetch(n.url);if(!e.ok)throw Error(`${e.status} ${e.statusText}`);let r=await _.decodeAudioData(await e.arrayBuffer());t.push({...n,buffer:r})}catch{O(`Sample skipped: ${n.name}`)}S=t,N(),S.length&&O(`Loaded ${S.length} WAV samples`)}function I(){m=!1,h.forEach(clearTimeout),h=[],C.forEach(e=>{try{e.stop()}catch{}}),C=[],playState.textContent=`Stopped`,O(`Transport stopped`)}function L(e,t,n,r,i,a){let o=e.createOscillator(),s=e.createGain();o.type=r===9?`square`:i===`bass`?`triangle`:mode.value===`Soft`?`sine`:`sawtooth`,o.frequency.value=r===9?t===36?70:140:j(t),s.gain.value=(n||90)/(r===9?850:1300),o.connect(s).connect(v),o.start(),o.stop(e.currentTime+Math.max(.05,(a||120)/1e3)),C.push(o),o.onended=()=>C=C.filter(e=>e!==o)}function R(e,r,i,a,o,s){let c=t(S,r,i,a,o);if(!c)return!1;let l=e.createBufferSource(),u=e.createGain();return l.buffer=c.buffer,l.playbackRate.value=n(r,c.rootNote),u.gain.value=Math.max(.04,Math.min(1,(i||90)/127)),l.connect(u).connect(v),l.start(),l.stop(e.currentTime+Math.max(.08,(s||240)/1e3)),C.push(l),l.onended=()=>C=C.filter(e=>e!==l),!0}async function z(e){I(),await M(),await F(),m=!0,playState.textContent=`Playing`;let t=6e4/e.tempo,n=0;for(let r of e.notes||[]){let e=setTimeout(()=>{if(!m)return;let e=R(_,r.note,r.velocity,r.channel,r.role,r.duration);e&&(n+=1),e||L(_,r.note,r.velocity,r.channel,r.role,r.duration)},r.time*t/480);h.push(e)}let r=setTimeout(()=>{m&&O(n?`Playing ${e.name} with WAV sampler`:`Playing ${e.name} with synth fallback`)},20);h.push(r)}function B(){return D(),{tempo:Number(tempo.value),section:section.value,chord:chord.value,maqam:maqam.value,structure:s(T),timeline:T}}async function V(){let e=await E(`/api/status`);output.textContent=JSON.stringify(e,null,2),apiStatus.textContent=`Online`,O(`Status checked`)}async function H(){let e=await E(`/api/presets`);output.textContent=JSON.stringify(e,null,2),O(`Presets loaded`)}function U(e){for(let e of w.inputs.values())e.onmidimessage=t=>{let n=u(t.data);k(`${new Date().toLocaleTimeString()}  ${e.name||`MIDI Input`}  ${n}`),O(n)};w.onstatechange=()=>{let e=l(w);A(e),O(`MIDI devices: ${e.inputs.length} input / ${e.outputs.length} output`)},A(e)}async function W(){let e=c(navigator);if(!e.supported){A(),O(e.label);return}try{w=await navigator.requestMIDIAccess({sysex:!1});let e=l(w);U(e),output.textContent=JSON.stringify({midi:e},null,2),O(`MIDI enabled: ${e.inputs.length} input / ${e.outputs.length} output`)}catch{midiState.textContent=`Denied`,O(`MIDI permission denied or unavailable`)}}async function G(){p=await E(`/api/song-generate`,B()),output.textContent=JSON.stringify(p,null,2),monitor.textContent=p.notes.map(e=>`${e.time}  CH${e.channel}  NOTE ${e.note}  VEL ${e.velocity}  ${e.role}`).join(`
`),songName.textContent=p.name,O(`Generated ${p.name}`)}async function K(){await M(),p||await G(),await z(p)}async function q(){let e=await(await fetch(`/api/midi-export`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(B())})).blob(),t=URL.createObjectURL(e),n=document.createElement(`a`);n.href=t,n.download=`uaos-style.mid`,n.click(),URL.revokeObjectURL(t),O(`MIDI exported`)}async function J(){if(!g){O(`Install prompt not available. Use browser menu: Install app.`);return}g.prompt(),await g.userChoice,g=null}function Y(){let e={exportedAt:new Date().toISOString(),app:`UAOS HyperStation`,settings:JSON.parse(localStorage.getItem(`uaos.settings`)||`{}`),timeline:T,pattern:p},t=new Blob([JSON.stringify(e,null,2)],{type:`application/json`}),n=document.createElement(`a`);n.href=URL.createObjectURL(t),n.download=`uaos-project.json`,n.click(),O(`Project exported`)}function X(){if(document.querySelector(`#timelineRows`)){timelineRows.innerHTML=T.map((e,t)=>`
    <div class="timeline-row">
      <strong>${t+1}. ${e.section}</strong>
      <span>${e.bars} bars</span>
      <button class="mini danger" data-remove-timeline="${t}">Remove</button>
    </div>
  `).join(``);for(let e of timelineRows.querySelectorAll(`[data-remove-timeline]`))e.onclick=()=>{T=o(T,Number(e.dataset.removeTimeline)),D(),X(),O(`Timeline section removed`)}}}function Z(){T=a(T,timelineSection.value,timelineBars.value),D(),X(),O(`Timeline added: ${timelineSection.value}`)}document.querySelector(`#app`).innerHTML=`
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">U</div>
        <div>
          <h1>UAOS</h1>
          <p>HyperStation</p>
        </div>
      </div>

      <nav>
        <button class="nav active">Live Arranger</button>
        <button class="nav">MIDI Export</button>
        <button class="nav">Sound Library</button>
        <button class="nav">Mobile / Desktop</button>
      </nav>

      <div class="side-card"><span>Public API</span><strong id="apiStatus">Ready</strong></div>
      <div class="side-card"><span>Sampler</span><strong id="sampleState">Checking</strong></div>
      <div class="side-card"><span>MIDI</span><strong id="midiState">Checking</strong></div>
      <div class="side-card"><span>Transport</span><strong id="playState">Stopped</strong></div>
      <div class="side-card"><span>Build</span><strong>Web + APK + EXE</strong></div>
    </aside>

    <main class="main">
      <section class="topbar">
        <div>
          <p class="eyebrow">AEPlatform Final App Foundation</p>
          <h2 id="songName">UAOS HyperStation</h2>
        </div>
        <div class="top-actions">
          <button id="installBtn" class="ghost" style="display:none">Install App</button>
          <button id="statusBtn" class="ghost">Status</button>
          <button id="presetsBtn" class="ghost">Presets</button>
          <button id="midiInputBtn" class="ghost">Enable MIDI</button>
          <button id="midiBtn" class="primary">Export MIDI</button>
        </div>
      </section>

      <section class="hero-card">
        <div>
          <h3>Apple-like live arranger workstation</h3>
          <p>One public app for web, desktop, and Android. Generate sections, play audio, export MIDI, and save project state.</p>
        </div>
        <div class="pill-row">
          <span>Public Web</span>
          <span>Desktop EXE</span>
          <span>Android APK</span>
          <span>iOS Ready</span>
        </div>
      </section>

      <section class="grid">
        <div class="panel controls">
          <h3>Arranger Controls</h3>

          <label>Mode</label>
          <select id="mode">
            <option>Soft</option>
            <option>Bright</option>
          </select>

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

          <label>Tempo <span id="tempoLabel">96</span></label>
          <input id="tempo" type="range" min="60" max="160" value="96"/>

          <div class="transport">
            <button id="generateBtn" class="primary">Generate</button>
            <button id="playBtn">Play</button>
            <button id="stopBtn" class="danger">Stop</button>
          </div>

          <button id="exportProjectBtn">Export Project JSON</button>
        </div>

        <div class="panel controls">
          <h3>Style Timeline</h3>
          <label>Section</label>
          <select id="timelineSection">
            <option>Intro</option><option>Main A</option><option>Main B</option><option>Main C</option><option>Main D</option><option>Fill</option><option>Break</option><option>Ending</option>
          </select>
          <label>Bars</label>
          <input id="timelineBars" type="number" min="1" max="64" value="4"/>
          <button id="timelineAddBtn" class="primary">Add Section</button>
          <div id="timelineRows" class="timeline-rows"></div>
        </div>

        <div class="panel"><h3>Pattern Output</h3><pre id="output">Ready.</pre></div>
        <div class="panel"><h3>MIDI Monitor</h3><pre id="monitor"></pre></div>
        <div class="panel"><h3>System Log</h3><div id="logs" class="logs"></div></div>
      </section>
    </main>
  </div>
`,tempo.value=f.tempo||96,section.value=f.section||`Main A`,chord.value=f.chord||`Cm`,maqam.value=f.maqam||`Nahawand`,mode.value=f.mode||`Soft`,tempoLabel.textContent=tempo.value,X(),tempo.oninput=()=>{tempoLabel.textContent=tempo.value,D()},section.onchange=D,chord.onchange=D,maqam.onchange=D,mode.onchange=D,installBtn.onclick=J,statusBtn.onclick=V,presetsBtn.onclick=H,midiInputBtn.onclick=W,generateBtn.onclick=G,playBtn.onclick=K,stopBtn.onclick=I,midiBtn.onclick=q,exportProjectBtn.onclick=Y,timelineAddBtn.onclick=Z,V().catch(()=>O(`Public API check failed`)),P().catch(()=>O(`Sampler preload failed`)),A();