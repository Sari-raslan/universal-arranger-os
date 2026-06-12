$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
Set-Location $Root
New-Item -ItemType Directory -Force scripts,reports,agent-output,agents/tasks | Out-Null
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="reports\UAOS_V12_ONE_CLICK_ALL_$Stamp.txt"
function L($m){ $m | Tee-Object -FilePath $Log -Append }
L "UAOS V1.2 ONE CLICK ALL"
L "Time: $(Get-Date)"

L "=== FIX GITIGNORE ==="
$GitIgnore="node_modules/`ndist/`nbuild/`n.vite/`n.vercel/`n.gradle/`nagent-output/*.log`nreports/*.txt`n*.apk`n*.aab`n*.ipa`n*.exe`n*.msi`n*.zip`n*.7z"
$GitIgnore | Set-Content ".gitignore" -Encoding UTF8

L "=== WRITE APP V1.2 ==="
$AppJs = @()
$AppJs += "import React, { useMemo, useState } from 'react';"
$AppJs += "import './style.css';"
$AppJs += ""
$AppJs += "const plans=["
$AppJs += "{id:'sing',name:'UAOS Sing',price:'9-15 EUR',text:'Voice to full music for singers.'},"
$AppJs += "{id:'studio',name:'UAOS Studio',price:'19-29 EUR',text:'Easy music studio for creators.'},"
$AppJs += "{id:'pro',name:'UAOS Pro Arranger',price:'49-99 EUR',text:'Professional arranger tools for keyboards.'}"
$AppJs += "];"
$AppJs += "function setRoute(p,s){window.location.hash='#/'+p;s(p)}"
$AppJs += "function Nav({page,setPage}){const items=['home','sing','studio','pro','midi','sounds','sampler','promo','pricing','downloads'];return <nav className='nav'><b className='brand'>UAOS</b><div className='navItems'>{items.map(x=><button key={x} className={page===x?'active':'} onClick={()=>setRoute(x,setPage)}>{x}</button>)}</div></nav>}"
$AppJs += "function Home({setPage}){return <main className='page'><section className='hero'><p className='eyebrow'>PUBLIC V1.2</p><h1>Sing. Create. Arrange.</h1><p className='lead'>UAOS is now a multi-product music platform: Singer, Creator Studio, Pro Arranger, Sound Library, and Sampler foundation.</p><div className='heroActions'><button onClick={()=>setRoute('sing',setPage)}>Start Sing</button><button className='secondary' onClick={()=>setRoute('studio',setPage)}>Open Studio</button><button className='secondary' onClick={()=>setRoute('pro',setPage)}>Pro Arranger</button></div></section><section className='cards'>{plans.map(p=><article className='card' key={p.id}><h2>{p.name}</h2><p>{p.text}</p><b>{p.price}</b></article>)}</section></main>}"
$AppJs += "function Sing(){const [name,setName]=useState(localStorage.getItem('uaos_project_name')||'My UAOS Song');const [voice,setVoice]=useState('No file selected');function save(){localStorage.setItem('uaos_project_name',name);alert('Saved locally')}return <main className='page'><section className='panel'><p className='eyebrow'>UAOS Sing</p><h1>Voice to Music</h1><p className='lead'>Upload your voice and prepare the first voice-to-arrangement workflow.</p><input value={name} onChange={e=>setName(e.target.value)}/><input type='file' accept='audio/*' onChange={e=>setVoice(e.target.files?.[0]?.name||'No file selected')}/><div className='fakeBox'><b>Voice:</b> {voice}</div><div className='workflow'><div>Upload</div><div>Style</div><div>Generate</div><div>Export</div></div><button onClick={save}>Save Local Project</button></section></main>}"
$AppJs += "function Studio(){return <main className='page'><section className='panel'><p className='eyebrow'>UAOS Studio</p><h1>Creator Studio</h1><div className='studioGrid'>{['Drums','Bass','Chords','Piano','Strings','Lead','Vocal','FX'].map(t=><div className='track' key={t}><span>{t}</span><button>Mute</button><button>Solo</button></div>)}</div></section></main>}"
$AppJs += "function Pro(){return <main className='page'><section className='panel'><p className='eyebrow'>UAOS Pro Arranger</p><h1>Keyboard Tools</h1><div className='cards'>{['KORG','Yamaha','Roland','Ketron'].map(d=><article className='card' key={d}><h2>{d}</h2><p>Style, Set, MIDI, SongBook profile.</p><button>Open Profile</button></article>)}</div></section></main>}"
$AppJs += "function Midi(){const [status,setStatus]=useState('Not scanned');const [ins,setIns]=useState([]);const [outs,setOuts]=useState([]);async function scan(){if(!navigator.requestMIDIAccess){setStatus('WebMIDI not available. Use Chrome or Electron.');return}try{const a=await navigator.requestMIDIAccess();setIns([...a.inputs.values()].map(x=>x.name));setOuts([...a.outputs.values()].map(x=>x.name));setStatus('MIDI scan complete')}catch(e){setStatus('MIDI permission failed')}}return <main className='page'><section className='panel'><p className='eyebrow'>MIDI Diagnostics</p><h1>Real WebMIDI Scan</h1><button onClick={scan}>Scan MIDI</button><div className='fakeBox'>{status}</div><div className='cards'><article className='card'><h2>Inputs</h2>{ins.map(x=><p key={x}>{x}</p>)}</article><article className='card'><h2>Outputs</h2>{outs.map(x=><p key={x}>{x}</p>)}</article></div></section></main>}"
$AppJs += "function Sounds(){return <main className='page'><section className='panel'><p className='eyebrow'>UAOS Sound Library</p><h1>Sounds & Libraries</h1><p className='lead'>Foundation for Oriental, Gulf, Turkish, Western and cinematic libraries.</p><div className='cards'>{['Oriental','Gulf','Turkish','Western','Violin','Oud'].map(x=><article className='card' key={x}><h2>{x}</h2><p>Library placeholder with articulations, velocity layers, and human feel plan.</p></article>)}</div></section></main>}"
$AppJs += "function Sampler(){return <main className='page'><section className='panel'><p className='eyebrow'>UAOS Sampler</p><h1>Sampler Foundation</h1><div className='workflow'><div>Samples</div><div>Velocity</div><div>Round Robin</div><div>Articulations</div></div><div className='fakeBox'>Next engine: mapping, key zones, ADSR, filters, MIDI trigger, export packs.</div></section></main>}"
$AppJs += "function Promo(){return <main className='page'><section className='panel'><p className='eyebrow'>Promotion</p><h1>Marketing Message</h1><div className='fakeBox'>Sing. Create. Arrange. UAOS turns your voice and musical ideas into complete arrangements.</div><div className='cards'><article className='card'><h2>TikTok</h2><p>Before voice / after UAOS arrangement.</p></article><article className='card'><h2>YouTube</h2><p>Demo song, MIDI, arranger conversion.</p></article><article className='card'><h2>Pro Market</h2><p>Keyboard players, sets, styles, sampler tools.</p></article></div></section></main>}"
$AppJs += "function Pricing(){return <main className='page'><section className='panel'><h1>Pricing</h1><div className='cards'>{plans.map(p=><article className='card' key={p.id}><h2>{p.name}</h2><p>{p.price}</p><p>{p.text}</p></article>)}</div></section></main>}"
$AppJs += "function Downloads(){return <main className='page'><section className='panel'><h1>Downloads</h1><p className='lead'>Web is live. Desktop and APK come after V1 web stabilization.</p></section></main>}"
$AppJs += "export default function App(){const [page,setPage]=useState(window.location.hash.replace('#/','')||'home');const screen=useMemo(()=>{if(page==='sing')return <Sing/>;if(page==='studio')return <Studio/>;if(page==='pro')return <Pro/>;if(page==='midi')return <Midi/>;if(page==='sounds')return <Sounds/>;if(page==='sampler')return <Sampler/>;if(page==='promo')return <Promo/>;if(page==='pricing')return <Pricing/>;if(page==='downloads')return <Downloads/>;return <Home setPage={setPage}/>},[page]);return <><Nav page={page} setPage={setPage}/>{screen}<footer>UAOS Public V1.2</footer></>}"
$AppJs | Set-Content "$App\src\App.jsx" -Encoding UTF8

L "=== WRITE AGENT TASK DOCS ==="
$Txt="# UAOS AUTO AGENT ROADMAP`n`nDONE:`n- V1 public web`n- V1.2 pages`n- Sound Library page`n- Sampler foundation`n- Promotion page`n- WebMIDI scan`n`nNEXT:`n- Real React Router`n- Electron MIDI bridge`n- Voice analysis pipeline`n- Audio engine`n- Desktop build`n- APK build"
$Txt | Set-Content "agents/tasks/UAOS_AUTO_AGENT_ROADMAP.md" -Encoding UTF8

L "=== BUILD ==="
npm run build --prefix uaos-live-clean | Tee-Object -FilePath $Log -Append
if ($LASTEXITCODE -eq 0) {
  L "Build OK"
  git add .gitignore
  git add uaos-live-clean/src/App.jsx
  git add agents/tasks/UAOS_AUTO_AGENT_ROADMAP.md
  git add scripts/UAOS_V12_ONE_CLICK_ALL.ps1
  git commit -m "Add UAOS V1.2 sound sampler promotion pages" 2>&1 | Tee-Object -FilePath $Log -Append
} else {
  L "Build failed. No commit."
}

L "=== DEPLOY ==="
Set-Location "$Root\uaos-live-clean"
if (Get-Command vercel -ErrorAction SilentlyContinue) { vercel --prod --yes | Tee-Object -FilePath $Log -Append } else { L "Vercel CLI not found" }
Set-Location $Root

L "=== STATUS ==="
git status | Tee-Object -FilePath $Log -Append
notepad $Log
