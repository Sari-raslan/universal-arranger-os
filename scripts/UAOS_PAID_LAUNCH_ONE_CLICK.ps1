$ErrorActionPreference="Continue"

$Repo=(Get-Location).Path
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"

New-Item -ItemType Directory -Force scripts,reports,landing-sales,landing-sales\src,agent-output,marketing | Out-Null

function Log($m){
$l="[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
Write-Host $l
Add-Content "$Repo\reports\UAOS_PAID_LAUNCH_$Stamp.log" $l
}

Log "UAOS PAID LAUNCH START"

$App="$Repo\landing-sales"

$ProLink=$env:UAOS_PRO_CHECKOUT
if(!$ProLink){$ProLink="https://YOUR-CHECKOUT-LINK-PRO"}

$FounderLink=$env:UAOS_FOUNDER_CHECKOUT
if(!$FounderLink){$FounderLink="https://YOUR-CHECKOUT-LINK-FOUNDER"}

Set-Content "$App\package.json" "{`"name`":`"uaos-paid-launch`",`"version`":`"1.0.0`",`"type`":`"module`",`"scripts`":{`"dev`":`"vite --host 0.0.0.0 --port 5200`",`"build`":`"vite build`"},`"dependencies`":{`"@vitejs/plugin-react`":`"latest`",`"vite`":`"latest`",`"react`":`"latest`",`"react-dom`":`"latest`"}}" -Encoding UTF8

Set-Content "$App\index.html" "<div id=`"root`"></div><script type=`"module`" src=`"/src/main.jsx`"></script>" -Encoding UTF8

$Main = "import React from `"react`";import{createRoot}from`"react-dom/client`";const PRO_LINK=`"$ProLink`";const FOUNDER_LINK=`"$FounderLink`";function Price(p){return <div style={{background:`"#111827`",border:`"1px solid #334155`",borderRadius:24,padding:26}}>{p.badge&&<div style={{display:`"inline-block`",background:`"#facc15`",color:`"#111827`",padding:`"6px 12px`",borderRadius:999,fontWeight:800,marginBottom:12}}>{p.badge}</div>}<h2>{p.title}</h2>{p.old&&<p style={{textDecoration:`"line-through`",color:`"#94a3b8`"}}>{p.old}</p>}<h1 style={{fontSize:44,margin:`"8px 0`",color:`"#86efac`"}}>{p.price}</h1><div style={{color:`"#d1d5db`",minHeight:120}}>{p.children}</div><a href={p.link} style={{display:`"block`",textAlign:`"center`",marginTop:22,padding:`"15px 18px`",borderRadius:14,background:`"#2563eb`",color:`"white`",textDecoration:`"none`",fontWeight:800}}>Buy Now</a></div>}function App(){return <main style={{minHeight:`"100vh`",background:`"#050816`",color:`"white`",fontFamily:`"Arial`",padding:34}}><section style={{maxWidth:1180,margin:`"0 auto`",padding:`"60px 0`"}}><div style={{background:`"#111827`",border:`"1px solid #334155`",borderRadius:30,padding:36}}><div style={{display:`"inline-block`",background:`"#22c55e`",color:`"#04130a`",padding:`"8px 14px`",borderRadius:999,fontWeight:800}}>FOUNDERS EARLY ACCESS - 20% OFF</div><h1 style={{fontSize:64,margin:`"20px 0 10px`"}}>UAOS HyperStation</h1><h2 style={{color:`"#93c5fd`"}}>AI Oriental Arranger, MIDI Runtime & DAW Creation Platform</h2><p style={{fontSize:21,color:`"#d1d5db`",maxWidth:850}}>Turn melodies, chords, live MIDI and musical ideas into arranger-ready workflows, Cubase exports, sampler systems and AI-assisted composition.</p><div style={{display:`"flex`",gap:14,flexWrap:`"wrap`",marginTop:26}}><a href={FOUNDER_LINK} style={{padding:`"16px 22px`",borderRadius:14,background:`"#facc15`",color:`"#111827`",fontWeight:900,textDecoration:`"none`"}}>Get Founder Lifetime</a><a href={PRO_LINK} style={{padding:`"16px 22px`",borderRadius:14,background:`"#2563eb`",color:`"white`",fontWeight:900,textDecoration:`"none`"}}>Start Pro</a></div></div><section style={{display:`"grid`",gridTemplateColumns:`"repeat(auto-fit,minmax(260px,1fr))`",gap:18,marginTop:24}}><Price title=`"Starter`" old=`"€9.99/mo`" price=`"€7.99/mo`" link={PRO_LINK}><ul><li>Chord Reader</li><li>Basic MIDI tools</li><li>Early Access dashboard</li></ul></Price><Price title=`"Pro`" old=`"€24.99/mo`" price=`"€19.99/mo`" link={PRO_LINK} badge=`"Best launch offer`"><ul><li>Arranger Engine</li><li>MIDI Runtime</li><li>Oriental/Maqam tools</li><li>Cubase export roadmap</li></ul></Price><Price title=`"Founder Lifetime`" old=`"€299`" price=`"€239 once`" link={FOUNDER_LINK} badge=`"First 100 users`"><ul><li>Lifetime Founder access</li><li>Founder badge</li><li>Early sampler access</li><li>Private community</li></ul></Price></section></section></main>}createRoot(document.getElementById(`"root`")).render(<App/>);"

Set-Content "$App\src\main.jsx" $Main -Encoding UTF8

$Marketing = "UAOS Launch Marketing Posts`r`n`r`nTikTok/Reels 1:`r`nI am building UAOS HyperStation: an AI Oriental Arranger that turns chords and MIDI ideas into full arranger workflows.`r`n`r`nTikTok/Reels 2:`r`nImagine KORG/Genos style workflow + AI + MIDI + Cubase export in one platform.`r`n`r`nCTA:`r`nJoin Founder Early Access: $FounderLink"
Set-Content "$Repo\marketing\UAOS_SOCIAL_POSTS.md" $Marketing -Encoding UTF8

$Checklist = "UAOS PAID LAUNCH CHECKLIST`r`n`r`n1. Add checkout links.`r`n2. Run the paid launcher.`r`n3. Publish TikTok/Reels/Shorts.`r`n4. Founder Lifetime price: 239 EUR first 100 users.`r`n`r`nPRO: $ProLink`r`nFOUNDER: $FounderLink"
Set-Content "$Repo\agent-output\PAID_LAUNCH_CHECKLIST.md" $Checklist -Encoding UTF8

Log "INSTALL"
npm install --prefix landing-sales

Log "BUILD"
npm run build --prefix landing-sales

Log "VERCEL CONFIG"
Set-Content "$Repo\vercel.json" "{`"version`":2,`"installCommand`":`"npm install --prefix landing-sales`",`"buildCommand`":`"npm run build --prefix landing-sales`",`"outputDirectory`":`"landing-sales/dist`",`"framework`":`"vite`",`"rewrites`":[{`"source`":`"/(.*)`",`"destination`":`"/index.html`"}]}" -Encoding UTF8

Log "GIT"
git add .
git commit -m `"Launch UAOS paid Founder landing page`"

Log "DEPLOY"
vercel --prod --yes

Log "PUSH"
git push origin master

Log "OPEN"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$Repo\landing-sales`"; npm run dev"
Start-Sleep 5
Start-Process "http://127.0.0.1:5200"

Log "DONE"
notepad "$Repo\agent-output\PAID_LAUNCH_CHECKLIST.md"

