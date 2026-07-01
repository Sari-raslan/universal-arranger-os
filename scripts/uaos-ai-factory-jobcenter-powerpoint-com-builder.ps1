$ErrorActionPreference = "Stop"

$Root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$PackDir = Join-Path $Root "uaos-ai-factory\jobcenter-send-ready"
$ProofDir = Join-Path $PackDir "ppt-visual-proof"
$FinalPptx = Join-Path $PackDir "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.pptx"
$FinalFallbackPdf = Join-Path $ProofDir "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE_PRESENTATION_FALLBACK.pdf"
$TempDir = Join-Path $PackDir "ppt-visual-proof-temp"
$TempPptx = Join-Path $TempDir "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.tmp.pptx"
$TempFallbackPdf = Join-Path $TempDir "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE_PRESENTATION_FALLBACK.pdf"

$Slides = @(
  [pscustomobject]@{
    Title = "UAOS / Universal Arranger OS - Businessplan"
    Body = @(
      "Jobcenter-only Unterlage vom 01.07.2026",
      "Lokaler Projektstand für Prüfung und Gespräch",
      "Keine Veröffentlichung, kein Deploy, kein Payment"
    )
  },
  [pscustomobject]@{
    Title = "Kurzbeschreibung"
    Body = @(
      "UAOS ist ein lokales Softwareprojekt für musikalische Arbeitsabläufe und Arrangement-Planung.",
      "Die Präsentation zeigt einen dokumentierten, nicht öffentlichen Projektstand.",
      "Der Fokus liegt auf Nachvollziehbarkeit, Prüfung und geordneter Weiterentwicklung."
    )
  },
  [pscustomobject]@{
    Title = "Aktueller Projektstand zum 01.07.2026"
    Body = @(
      "Lokaler Prototyp und Evidence Pack sind vorhanden.",
      "Öffentliche Veröffentlichung wurde nicht freigegeben.",
      "Kein Push, kein Upload, kein Deploy und kein Vercel."
    )
  },
  [pscustomobject]@{
    Title = "Bisherige Eigenleistung"
    Body = @(
      "Der Projektstand wurde eigenständig aufgebaut, geordnet und dokumentiert.",
      "Dazu gehören lokale Struktur, QA-Prüfung, Businessplan und Nachweisdateien.",
      "Die Arbeit zeigt zuverlässige Projektorganisation und technische Lernleistung."
    )
  },
  [pscustomobject]@{
    Title = "Bedarf an Arbeitsmitteln: Laptop / Workstation"
    Body = @(
      "Ein geeignetes Arbeitsgerät wird für lokale Entwicklung, Tests und Dokumentation benötigt.",
      "Stabile Hardware ist wichtig für PDF/PPT-Unterlagen, QA-Berichte und Review-Prozesse.",
      "Ohne zuverlässiges Arbeitsmittel bleiben nächste Schritte deutlich eingeschränkt."
    )
  },
  [pscustomobject]@{
    Title = "Geplante nächste Entwicklungsschritte"
    Body = @(
      "Manuelle Jobcenter-Prüfung dieser Unterlagen.",
      "Fortgesetzte lokale Entwicklung ohne Keyboard-Ausgabe oder Transfer.",
      "Weitere sichere Dokumentation und technische Prüfung vor späteren Freigaben."
    )
  },
  [pscustomobject]@{
    Title = "Lokaler Nachweisstand / Evidence Pack"
    Body = @(
      "Businessplan, Präsentation, Statusdateien und lokale QA-Ergebnisse liegen vor.",
      "Die Unterlagen bleiben lokal und enthalten keinen Weblink.",
      "Der Nachweisstand ist für eine nachvollziehbare Prüfung vorbereitet."
    )
  },
  [pscustomobject]@{
    Title = "Risiken und klare Abgrenzung"
    Body = @(
      "Nicht für produktiven Einsatz freigegeben.",
      "Kein Zahlungssystem, kein Deploy und keine öffentliche Projektfreigabe.",
      "Keine Keyboard-native Ausgabe, kein Keyboard Transfer und keine Hardware-Übertragung."
    )
  },
  [pscustomobject]@{
    Title = "Projekt-Monitor"
    Body = @(
      "Projekt-Monitor:",
      "Der Projekt-Monitor ist vorgesehen und wird nach technischer Freigabe separat nachgereicht.",
      "Status:",
      "Derzeit wird kein öffentlicher Projektlink als aktiver Nachweis verwendet. Es wurde kein Push, kein Upload und kein Deploy freigegeben."
    )
  },
  [pscustomobject]@{
    Title = "Zusammenfassung / Gesprächswunsch"
    Body = @(
      "UAOS ist als lokales Entwicklungsprojekt mit klaren Grenzen dokumentiert.",
      "Die Unterstützung betrifft Arbeitsmittel und weitere strukturierte Prüfung.",
      "Gewünscht ist ein Gespräch über die nächsten sicheren lokalen Entwicklungsschritte."
    )
  }
)

function New-DirectoryClean {
  param([string]$Path)
  if (Test-Path -LiteralPath $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force
  }
  New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

function Add-TextBox {
  param(
    [object]$Slide,
    [string]$Text,
    [double]$Left,
    [double]$Top,
    [double]$Width,
    [double]$Height,
    [int]$FontSize,
    [bool]$Bold,
    [int]$Color
  )
  $shape = $Slide.Shapes.AddTextbox(1, $Left, $Top, $Width, $Height)
  $shape.TextFrame.TextRange.Text = $Text
  $shape.TextFrame.TextRange.Font.Name = "Arial"
  $shape.TextFrame.TextRange.Font.Size = $FontSize
  $shape.TextFrame.TextRange.Font.Bold = $(if ($Bold) { -1 } else { 0 })
  $shape.TextFrame.TextRange.Font.Color.RGB = $Color
  $shape.TextFrame.MarginLeft = 10
  $shape.TextFrame.MarginRight = 10
  $shape.TextFrame.MarginTop = 8
  $shape.TextFrame.MarginBottom = 8
  return $shape
}

New-DirectoryClean -Path $TempDir

$powerPoint = $null
$presentation = $null
try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $powerPoint.Visible = -1
  $powerPoint.DisplayAlerts = 1

  $presentation = $powerPoint.Presentations.Add($true)
  $presentation.PageSetup.SlideSize = 13
  $presentation.PageSetup.SlideWidth = 960
  $presentation.PageSetup.SlideHeight = 540

  for ($i = 0; $i -lt $Slides.Count; $i++) {
    $slideNo = $i + 1
    $slide = $presentation.Slides.Add($slideNo, 12)
    $slide.FollowMasterBackground = $false
    $slide.Background.Fill.Solid()
    $slide.Background.Fill.ForeColor.RGB = 1973790

    $accent = $slide.Shapes.AddShape(1, 0, 0, 960, 10)
    $accent.Fill.ForeColor.RGB = 3978097
    $accent.Line.Visible = 0

    $sideAccent = $slide.Shapes.AddShape(1, 0, 10, 16, 530)
    $sideAccent.Fill.ForeColor.RGB = 919046
    $sideAccent.Line.Visible = 0

    Add-TextBox -Slide $slide -Text $Slides[$i].Title -Left 54 -Top 42 -Width 844 -Height 72 -FontSize 29 -Bold $true -Color 16777215 | Out-Null

    $bodyText = [string]::Join([Environment]::NewLine + [Environment]::NewLine, ($Slides[$i].Body | ForEach-Object { [char]0x2022 + " " + $_ }))
    Add-TextBox -Slide $slide -Text $bodyText -Left 70 -Top 146 -Width 800 -Height 290 -FontSize 19 -Bold $false -Color 15132390 | Out-Null

    $footerText = "LOCAL ONLY | JOBCENTER ONLY | NO PUSH | NO DEPLOY | NO VERCEL | NO PAYMENT | NO KEYBOARD OUTPUT"
    Add-TextBox -Slide $slide -Text $footerText -Left 54 -Top 488 -Width 852 -Height 24 -FontSize 9 -Bold $false -Color 11579568 | Out-Null
  }

  $presentation.SaveAs($TempPptx, 24)
  $presentation.SaveAs($TempFallbackPdf, 32)

  for ($i = 1; $i -le $presentation.Slides.Count; $i++) {
    $pngPath = Join-Path $TempDir ("slide-{0:D2}.png" -f $i)
    $presentation.Slides.Item($i).Export($pngPath, "PNG", 1280, 720)
  }
} finally {
  if ($presentation -ne $null) { $presentation.Close() }
  if ($powerPoint -ne $null) { $powerPoint.Quit() }
}

if (-not (Test-Path -LiteralPath $TempPptx) -or ((Get-Item -LiteralPath $TempPptx).Length -le 0)) {
  throw "PowerPoint COM did not create a valid PPTX."
}
if (-not (Test-Path -LiteralPath $TempFallbackPdf) -or ((Get-Item -LiteralPath $TempFallbackPdf).Length -le 0)) {
  throw "PowerPoint COM did not create a valid fallback PDF."
}
$pngs = Get-ChildItem -LiteralPath $TempDir -Filter "slide-*.png" -File | Sort-Object Name
if ($pngs.Count -lt 10) {
  throw "PowerPoint COM did not export 10 PNG slide proofs."
}
foreach ($png in $pngs) {
  if ($png.Length -le 0) {
    throw "Empty PNG proof found: $($png.FullName)"
  }
}

New-DirectoryClean -Path $ProofDir
Move-Item -LiteralPath $TempFallbackPdf -Destination $FinalFallbackPdf -Force
foreach ($png in $pngs) {
  Move-Item -LiteralPath $png.FullName -Destination (Join-Path $ProofDir $png.Name) -Force
}
Move-Item -LiteralPath $TempPptx -Destination $FinalPptx -Force
Remove-Item -LiteralPath $TempDir -Recurse -Force

Write-Output "UAOS Jobcenter PowerPoint Visual COM Builder"
Write-Output "Status: PASS"
Write-Output "PPTX: $FinalPptx"
Write-Output "Fallback PDF: $FinalFallbackPdf"
Write-Output "PNG slide proofs: $($pngs.Count)"
