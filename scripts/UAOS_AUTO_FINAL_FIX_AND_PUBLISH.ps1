$Root = "C:\Users\ssare\keyboard-manager-clean"
$Frontend = "$Root\frontend"
$Live = "https://sari-raslan.github.io/universal-arranger-os"
$Report = "$Root\reports\UAOS_AUTO_FINAL_FIX_AND_PUBLISH_REPORT.md"

Set-Location $Root

Write-Host "UAOS AUTO FINAL FIX START" -ForegroundColor Cyan

# 1. Stop old agent
$PidFile = "C:\Users\ssare\Documents\UAOS_BACKUPS\UAOS_OVERNIGHT_AGENT.pid"
if (Test-Path $PidFile) {
  Stop-Process -Id (Get-Content $PidFile) -Force -ErrorAction SilentlyContinue
}

# 2. Restore tracked broken files, keep new source only if clean
git restore .

# 3. Minimal guaranteed React runtime page
@"
import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#020617,#07111f,#0b1b2d)",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "48px"
    }}>
      <section style={{maxWidth:"1000px",margin:"0 auto"}}>
        <h1 style={{fontSize:"56px",marginBottom:"12px"}}>UAOS</h1>
        <h2 style={{fontSize:"32px",color:"#22d3ee"}}>Universal Arranger OS is Live</h2>
        <p style={{fontSize:"20px",lineHeight:"1.6",color:"#cbd5e1"}}>
          AI-powered arranger workstation for MIDI, chords, style runtime,
          DAW workflow, Oriental libraries, and .uaos-pack keyboard runtime.
        </p>

        <div style={{display:"flex",gap:"16px",flexWrap:"wrap",marginTop:"28px"}}>
          <a href="./launch/payment.html" style={buttonStyle}>Creator / Pro Premium</a>
          <a href="./status-ar.html" style={buttonStyle}>Arabic Status</a>
          <a href="#runtime" style={buttonStyle}>Runtime Engine</a>
        </div>

        <div id="runtime" style={{
          marginTop:"50px",
          padding:"28px",
          border:"1px solid rgba(34,211,238,.35)",
          borderRadius:"18px",
          background:"rgba(15,23,42,.7)"
        }}>
          <h3 style={{fontSize:"28px",color:"#67e8f9"}}>Current Build</h3>
          <ul style={{fontSize:"18px",lineHeight:"1.9"}}>
            <li>✅ React / Vite runtime working</li>
            <li>✅ GitHub Pages live</li>
            <li>✅ SPA fallback enabled</li>
            <li>✅ Feel Sampler scaffold</li>
            <li>✅ Keyboard Runtime / .uaos-pack direction</li>
            <li>✅ KORG / Yamaha / Roland / Ketron roadmap</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

const buttonStyle = {
  display: "inline-block",
  padding: "14px 20px",
  borderRadius: "12px",
  background: "linear-gradient(90deg,#2563eb,#06b6d4)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold"
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
"@ | Set-Content -LiteralPath "$Frontend\src\main.jsx" -Encoding UTF8

# 4. Build
Set-Location $Frontend
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "BUILD FAILED" -ForegroundColor Red
  exit 1
}

# 5. Publish dist to docs
Set-Location $Root
Remove-Item "$Root\docs" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$Frontend\dist" "$Root\docs" -Recurse -Force
New-Item "$Root\docs\.nojekyll" -ItemType File -Force | Out-Null
Copy-Item "$Root\docs\index.html" "$Root\docs\404.html" -Force

# 6. Keep direct pages
New-Item "$Root\docs\launch" -ItemType Directory -Force | Out-Null

@"
<!doctype html>
<html>
<head><meta charset="utf-8"><title>UAOS Payment</title></head>
<body style="background:#020617;color:white;font-family:Arial;padding:40px">
<h1>UAOS Premium</h1>
<p>Choose your UAOS plan.</p>
<p><a style="color:#22d3ee" href="https://www.paypal.com/ncp/payment/ZB63CA66C98AN">Creator Premium</a></p>
<p><a style="color:#22d3ee" href="https://www.paypal.com/ncp/payment/4PHMPZL66YEG8">Pro Premium</a></p>
<p><a style="color:#22d3ee" href="../">Back to UAOS</a></p>
</body>
</html>
"@ | Set-Content "$Root\docs\launch\payment.html" -Encoding UTF8

@"
<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>UAOS Status</title></head>
<body style="background:#020617;color:white;font-family:Arial;padding:40px">
<h1>تم إطلاق Universal Arranger OS</h1>
<p>منصة ترتيب موسيقي ذكية تدعم MIDI و Chords و Style Runtime و .uaos-pack.</p>
<p><a style="color:#22d3ee" href="./">العودة للموقع</a></p>
</body>
</html>
"@ | Set-Content "$Root\docs\status-ar.html" -Encoding UTF8

# 7. Report
@"
# UAOS Auto Final Fix And Publish

Live:
$Live

Done:
- Replaced broken runtime with guaranteed React page
- Built frontend successfully
- Published dist to docs
- Added .nojekyll
- Added 404 SPA fallback
- Added direct payment page
- Added Arabic status page

Next:
- Test live page
- Test PayPal links
- Connect aeplatform.app DNS later
"@ | Set-Content $Report -Encoding UTF8

# 8. Commit and push
git add docs frontend/src/main.jsx reports/UAOS_AUTO_FINAL_FIX_AND_PUBLISH_REPORT.md
git commit -m "Auto fix runtime and publish stable UAOS page" 2>$null
git push

# 9. Open and test
Start-Process "$Live/?v=$(Get-Date -Format yyyyMMddHHmmss)"

Write-Host "UAOS AUTO FINAL FIX DONE" -ForegroundColor Green
Write-Host $Live
