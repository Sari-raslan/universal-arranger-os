$ErrorActionPreference="Continue"

$Repo = "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Repo

$utf8 = New-Object System.Text.UTF8Encoding($false)
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"

function W($path,$text){
  [System.IO.File]::WriteAllText((Join-Path $Repo $path),$text,$utf8)
}

function Log($m){
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
  Write-Host $line -ForegroundColor Cyan
  Add-Content "$Repo\reports\UAOS_ORCHESTRATION_$Stamp.log" $line -Encoding UTF8
}

Log "START UAOS ORCHESTRATION"

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Log "WRITE ORCHESTRATOR"

W "orchestrator\RuntimeOrchestrator.cjs" '
class RuntimeOrchestrator {
  constructor({midi,chordDetector,stylePlayer,sampler,hardware,ai}){
    this.midi = midi;
    this.chordDetector = chordDetector;
    this.stylePlayer = stylePlayer;
    this.sampler = sampler;
    this.hardware = hardware;
    this.ai = ai;
    this.events = [];
  }

  noteOn(note){
    const midiEvent = this.midi.noteOn(note);

    const chord = this.chordDetector.noteOn(note);

    if(chord.detected){
      const suggestion = this.ai.suggestStyle(chord.chord);

      this.stylePlayer.loadStyle(suggestion.suggestion);

      this.events.push({
        type:"styleSuggestion",
        chord:chord.chord,
        style:suggestion.suggestion,
        time:Date.now()
      });
    }

    this.sampler.trigger("RealtimeVoice",note,100);

    return {
      ok:true,
      midiEvent,
      chord,
      style:this.stylePlayer.status(),
      sampler:this.sampler.status()
    };
  }

  noteOff(note){
    return {
      ok:true,
      midi:this.midi.noteOff(note),
      chord:this.chordDetector.noteOff(note)
    };
  }

  runtimeStatus(){
    return {
      ok:true,
      modules:{
        midi:this.midi.status(),
        arranger:this.stylePlayer.status(),
        sampler:this.sampler.status(),
        hardware:this.hardware.status(),
        ai:this.ai.status()
      },
      orchestration:{
        active:true,
        recentEvents:this.events.slice(-20)
      }
    };
  }
}

module.exports = { RuntimeOrchestrator };
'

Log "PATCH BACKEND"

$server = Get-Content "backend\server.js" -Raw

if($server -notmatch "RuntimeOrchestrator"){

$server = $server -replace 'const\{AiMusicLayer\}=require\("\.\./ai/AiMusicLayer\.cjs"\);','const{AiMusicLayer}=require("../ai/AiMusicLayer.cjs");const{RuntimeOrchestrator}=require("../orchestrator/RuntimeOrchestrator.cjs");'

$server = $server -replace 'const ai=new AiMusicLayer\(\);','const ai=new AiMusicLayer();const orchestrator=new RuntimeOrchestrator({midi,chordDetector,stylePlayer,sampler,hardware,ai});'

$insert = '
app.get("/runtime/orchestrator",(req,res)=>res.json(orchestrator.runtimeStatus()));

app.post("/runtime/orchestrator/noteon/:note",(req,res)=>{
  res.json(orchestrator.noteOn(Number(req.params.note)));
});

app.post("/runtime/orchestrator/noteoff/:note",(req,res)=>{
  res.json(orchestrator.noteOff(Number(req.params.note)));
});
'

$server = $server -replace 'app.get\("/api/status"',"$insert`napp.get(`"/api/status`""

[IO.File]::WriteAllText("$Repo\backend\server.js",$server,$utf8)

}

Log "START BACKEND"

$proc = Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden

Start-Sleep 5

Log "TEST ORCHESTRATION"

Invoke-WebRequest "http://localhost:8090/runtime/orchestrator" | Out-File "$Repo\reports\orchestrator-status-$Stamp.txt" -Encoding UTF8

Invoke-WebRequest -Method POST "http://localhost:8090/runtime/orchestrator/noteon/60" | Out-File "$Repo\reports\orchestrator-noteon1-$Stamp.txt" -Encoding UTF8

Invoke-WebRequest -Method POST "http://localhost:8090/runtime/orchestrator/noteon/64" | Out-File "$Repo\reports\orchestrator-noteon2-$Stamp.txt" -Encoding UTF8

Invoke-WebRequest -Method POST "http://localhost:8090/runtime/orchestrator/noteon/67" | Out-File "$Repo\reports\orchestrator-noteon3-$Stamp.txt" -Encoding UTF8

Invoke-WebRequest "http://localhost:8090/runtime/orchestrator" | Out-File "$Repo\reports\orchestrator-final-$Stamp.txt" -Encoding UTF8

try{
 Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}catch{}

Log "GIT"

git add .
git commit -m "Add realtime orchestration runtime layer"

git push origin v2/core-runtime-alpha

Log "DONE UAOS ORCHESTRATION"

notepad "$Repo\reports\UAOS_ORCHESTRATION_$Stamp.log"