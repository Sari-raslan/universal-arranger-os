(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``;async function t(t,n){let r=await fetch(e+t,{method:n?`POST`:`GET`,headers:{"Content-Type":`application/json`},body:n?JSON.stringify(n):void 0});if(!r.ok)throw Error(await r.text());return r.json()}function n(e,t){let n=new AudioContext;for(let r of e)setTimeout(()=>{let e=n.createOscillator(),t=n.createGain();e.frequency.value=440*2**((r.note-69)/12),t.gain.value=(r.velocity||90)/900,e.connect(t).connect(n.destination),e.start(),e.stop(n.currentTime+.25)},r.time*(6e4/t)/480)}document.querySelector(`#app`).innerHTML=`
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
`;var r=null;statusBtn.onclick=async()=>{r=await t(`/api/status`),out.textContent=JSON.stringify(r,null,2)},presetsBtn.onclick=async()=>{r=await t(`/api/presets`),out.textContent=JSON.stringify(r,null,2)},generateBtn.onclick=async()=>{r=await t(`/api/song-generate`,{tempo:96,maqam:`Nahawand`,chord:`Cm`}),out.textContent=JSON.stringify(r,null,2)},playBtn.onclick=async()=>{(!r||!r.notes)&&(r=await t(`/api/song-generate`,{tempo:96}),out.textContent=JSON.stringify(r,null,2)),n(r.notes,r.tempo||96)};