$ErrorActionPreference = 'Stop'
$root = 'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1501-v1700-final-owner-website-test-programs'
$forbiddenExt = @('.sty','.set','.prs','.prf','.kst')
$bad = @()

Get-ChildItem $root -Recurse -File | ForEach-Object {
  if ($forbiddenExt -contains $_.Extension.ToLowerInvariant()) {
    $bad += "Forbidden extension: $($_.FullName)"
  }

  if ($_.Extension.ToLowerInvariant() -in @('.html','.md','.txt','.json','.csv','.js','.css','.ps1')) {
    $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($c -match '(?i)\bwriter_ready\b\s*[:=]\s*(true|yes|1)\b') { $bad += "writer_ready unsafe: $($_.FullName)" }
    if ($c -match '(?i)\breal_writer_implemented\b\s*[:=]\s*(true|yes|1)\b') { $bad += "real writer unsafe: $($_.FullName)" }
    if ($c -match '(?i)\bkeyboard_package_output_generated\b\s*[:=]\s*(true|yes|1)\b') { $bad += "keyboard package unsafe: $($_.FullName)" }
    if ($c -match '(?i)\bdeploy\b\s*[:=]\s*(true|yes|enabled|active)\b') { $bad += "deploy unsafe: $($_.FullName)" }
    if ($c -match '(?i)\bpayment\b\s*[:=]\s*(true|yes|enabled|active)\b') { $bad += "payment unsafe: $($_.FullName)" }
  }
}

if ($bad.Count -eq 0) { Write-Host 'SAFETY_TEST: PASS'; exit 0 }
else { $bad | ForEach-Object { Write-Host $_ }; Write-Host 'SAFETY_TEST: FAIL'; exit 1 }
