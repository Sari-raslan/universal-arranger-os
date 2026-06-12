Write-Host "[AUDIO AGENT] START" -ForegroundColor Cyan

$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"

Set-Location $App

if(Test-Path ".\src\AudioEngine.jsx"){
  Write-Host "[AUDIO AGENT] AudioEngine exists" -ForegroundColor Green
}else{
  Write-Host "[AUDIO AGENT] Creating AudioEngine" -ForegroundColor Yellow

@"
import React from "react";

export default function AudioEngine(){
  return (
    <div style={{padding:20}}>
      <h2>UAOS Audio Engine</h2>
      <p>Audio foundation ready.</p>
    </div>
  );
}
"@ | Set-Content ".\src\AudioEngine.jsx" -Encoding UTF8
}
