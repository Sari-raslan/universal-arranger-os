$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $Root
$Report="reports\UAOS_PHASE4_REAL_INTEGRATION_REPORT.txt"
New-Item -ItemType Directory -Force -Path reports | Out-Null
function Log($m){ $x="[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"; Write-Host $x; Add-Content $Report $x }

Log "PHASE 4 REAL INTEGRATION START"

@'
export async function realAiArrange(input = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { ok:true, mode:"fallback", message:"OPENAI_API_KEY missing; using local AI mock", input };
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${key}`, "Content-Type":"application/json" },
    body:JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input:`Create arranger song sections and chords as JSON for: ${JSON.stringify(input)}`
    })
  });

  const data = await res.json();
  return { ok:true, mode:"openai", data };
}
