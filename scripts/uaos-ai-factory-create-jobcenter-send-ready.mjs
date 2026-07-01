import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packDir = path.join(root, "uaos-ai-factory/jobcenter-send-ready");
const sourceMd = path.join(packDir, "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.md");
const htmlPath = path.join(packDir, "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.html");
const pdfPath = path.join(packDir, "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.pdf");
const pptxPath = path.join(packDir, "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.pptx");
const fallbackPdfPath = path.join(packDir, "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE_PRESENTATION_FALLBACK.pdf");
const tempDir = path.join(packDir, "temp-pptx-build");
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const slides = [
  {
    title: "UAOS / Universal Arranger OS - Businessplan",
    bullets: [
      "Jobcenter-only Unterlage vom 01.07.2026",
      "Lokaler, nicht veröffentlichter Projektstand",
      "Kein Push, kein Upload, kein Deploy"
    ]
  },
  {
    title: "Kurzbeschreibung",
    bullets: [
      "UAOS unterstützt musikalische Arbeitsabläufe, Arrangement-Planung und strukturierte Projektentwicklung.",
      "Der aktuelle Stand ist ein lokaler Prototyp mit Evidence-Pack und QA-Prüfungen.",
      "Die Unterlage dient der Beratung und nachvollziehbaren Projektprüfung."
    ]
  },
  {
    title: "Aktueller Projektstand zum 01.07.2026",
    bullets: [
      "Lokaler Prototyp und lokale Projektstruktur sind vorhanden.",
      "Evidence-Pack und Review-Unterlagen sind vorbereitet.",
      "Öffentliche Freigabe, Payment, Deployment und Keyboard-Ausgabe sind nicht freigegeben."
    ]
  },
  {
    title: "Bisherige Eigenleistung",
    bullets: [
      "Aufbau der lokalen Projektstruktur und Dokumentation.",
      "Erstellung von Businessplan, Statusdateien, QA-Prüfungen und Evidence-Unterlagen.",
      "Klare Sicherheitsgrenzen für lokale Prüfung und weitere Entwicklung."
    ]
  },
  {
    title: "Bedarf an Arbeitsmitteln: Laptop / Workstation",
    bullets: [
      "Verlässliche lokale Entwicklungs- und Testumgebung.",
      "Stabile Bearbeitung von Projektdateien, PDF/PPT-Unterlagen und QA-Berichten.",
      "Grundlage für Beratung, Qualifizierung und dokumentierten Projektfortschritt."
    ]
  },
  {
    title: "Geplante nächste Entwicklungsschritte",
    bullets: [
      "Manuelle Jobcenter-Prüfung dieser Unterlagen.",
      "Fortgesetzte lokale Entwicklung ohne Keyboard-Ausgabe.",
      "Weitere UI-/Tooling-Verbesserungen und sichere Evidence-Dokumentation nach Prüfung."
    ]
  },
  {
    title: "Lokaler Nachweisstand / Evidence Pack",
    bullets: [
      "Businessplan-PDF und PowerPoint-Präsentation.",
      "Send-Ready-Index, Anlagen-Checkliste und lokale QA-Statusdateien.",
      "Nachweise bleiben lokal und enthalten keinen öffentlichen Projektlink."
    ]
  },
  {
    title: "Risiken und klare Abgrenzung",
    bullets: [
      "Kein öffentlicher Release, kein Payment, kein Deploy, kein Vercel.",
      "Keine Keyboard-native Ausgabe und kein Keyboard Transfer.",
      "Nicht für produktiven Einsatz freigegeben."
    ]
  },
  {
    title: "Projekt-Monitor",
    bullets: [
      "Projekt-Monitor:",
      "Der Projekt-Monitor ist vorgesehen und wird nach technischer Freigabe separat nachgereicht.",
      "Status:",
      "Derzeit wird kein öffentlicher Projektlink als aktiver Nachweis verwendet. Es wurde kein Push, kein Upload und kein Deploy freigegeben."
    ]
  },
  {
    title: "Zusammenfassung / Gesprächswunsch",
    bullets: [
      "UAOS ist als lokales Entwicklungsprojekt mit klaren Grenzen dokumentiert.",
      "Der Bedarf an geeigneten Arbeitsmitteln ist nachvollziehbar begründet.",
      "Gewünscht ist ein Gespräch zur Prüfung der nächsten lokalen Entwicklungsschritte."
    ]
  }
];

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function markdownToHtml(markdown) {
  return markdown.split(/\r?\n/).map((line) => {
    if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
    if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    if (line.startsWith("- ")) return `<p class="bullet">&#8226; ${escapeHtml(line.slice(2))}</p>`;
    if (!line.trim()) return "";
    return `<p>${escapeHtml(line)}</p>`;
  }).join("\n");
}

function fileUrl(filePath) {
  return `file:///${filePath.replaceAll("\\", "/").replaceAll(" ", "%20")}`;
}

function psLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function createPresentationWithPowerPoint() {
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  rmSync(pptxPath, { force: true });
  rmSync(fallbackPdfPath, { force: true });

  const psSlides = slides.map((slide) => {
    const bullets = slide.bullets.map((bullet) => psLiteral(bullet)).join(", ");
    return `[pscustomobject]@{ Title = ${psLiteral(slide.title)}; Bullets = @(${bullets}) }`;
  }).join(",\n  ");

  const psPath = path.join(tempDir, "create-jobcenter-presentation.ps1");
  const ps = `
$ErrorActionPreference = 'Stop'
$pptxPath = ${psLiteral(pptxPath)}
$fallbackPdfPath = ${psLiteral(fallbackPdfPath)}
$slides = @(
  ${psSlides}
)
$powerPoint = $null
$presentation = $null
try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $powerPoint.DisplayAlerts = 1
  $presentation = $powerPoint.Presentations.Add($true)
  $presentation.PageSetup.SlideWidth = 13.333333 * 72
  $presentation.PageSetup.SlideHeight = 7.5 * 72

  for ($i = 0; $i -lt $slides.Count; $i++) {
    $slide = $presentation.Slides.Add($i + 1, 12)
    $slide.FollowMasterBackground = $false
    $slide.Background.Fill.ForeColor.RGB = 16777215

    $titleBox = $slide.Shapes.AddTextbox(1, 42, 34, 872, 62)
    $titleBox.TextFrame.TextRange.Text = $slides[$i].Title
    $titleBox.TextFrame.TextRange.Font.Name = 'Arial'
    $titleBox.TextFrame.TextRange.Font.Size = 28
    $titleBox.TextFrame.TextRange.Font.Bold = -1
    $titleBox.TextFrame.TextRange.Font.Color.RGB = 3223857

    $bodyBox = $slide.Shapes.AddTextbox(1, 72, 124, 820, 360)
    $bodyText = [string]::Join([Environment]::NewLine, ($slides[$i].Bullets | ForEach-Object { [char]0x2022 + ' ' + $_ }))
    $bodyBox.TextFrame.TextRange.Text = $bodyText
    $bodyBox.TextFrame.TextRange.Font.Name = 'Arial'
    $bodyBox.TextFrame.TextRange.Font.Size = 18
    $bodyBox.TextFrame.TextRange.Font.Color.RGB = 3355443
    $bodyBox.TextFrame.MarginLeft = 8
    $bodyBox.TextFrame.MarginRight = 8
    $bodyBox.TextFrame.MarginTop = 8
    $bodyBox.TextFrame.MarginBottom = 8

    $footer = $slide.Shapes.AddTextbox(1, 42, 506, 872, 24)
    $footer.TextFrame.TextRange.Text = 'LOCAL ONLY - JOBCENTER ONLY - NO PUSH / NO DEPLOY / NO VERCEL / NO PAYMENT'
    $footer.TextFrame.TextRange.Font.Name = 'Arial'
    $footer.TextFrame.TextRange.Font.Size = 9
    $footer.TextFrame.TextRange.Font.Color.RGB = 7566195
  }

  $presentation.SaveAs($pptxPath, 24)
  $presentation.SaveAs($fallbackPdfPath, 32)
  Write-Output 'POWERPOINT_COM'
} finally {
  if ($presentation -ne $null) { $presentation.Close() }
  if ($powerPoint -ne $null) { $powerPoint.Quit() }
}
`;
  writeFileSync(psPath, ps, "utf8");
  const result = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psPath], { encoding: "utf8" });
  rmSync(tempDir, { recursive: true, force: true });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "PowerPoint COM presentation generation failed.");
  if (!existsSync(pptxPath) || statSync(pptxPath).size <= 0) throw new Error("PowerPoint COM did not create a valid PPTX.");
  return "PowerPoint COM";
}

function createPresentationWithLibreOffice() {
  const candidates = [
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
  ];
  const soffice = candidates.find((candidate) => existsSync(candidate));
  if (!soffice) throw new Error("Neither PowerPoint COM nor LibreOffice is available. STOP.");
  throw new Error(`LibreOffice fallback is available at ${soffice}, but no compatible source deck exists to convert. STOP.`);
}

if (!existsSync(sourceMd)) {
  console.error(`Missing Jobcenter source markdown: ${sourceMd}`);
  process.exit(1);
}
if (!existsSync(chrome)) {
  console.error("Local Chrome not found for Jobcenter PDF generation.");
  process.exit(1);
}

const markdown = readFileSync(sourceMd, "utf8");
const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>UAOS Jobcenter Businessplan 2026-07-01</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: Arial, "Segoe UI", sans-serif; color: #1f2933; line-height: 1.48; font-size: 11pt; }
    h1 { font-size: 22pt; border-bottom: 2px solid #2f6f73; padding-bottom: 8pt; }
    h2 { font-size: 14pt; color: #2f6f73; margin-top: 16pt; }
    .bullet { margin-left: 14pt; }
    .seal { border: 1px solid #9fb7bb; background: #f4f8f8; padding: 8pt; margin-bottom: 12pt; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="seal">LOCAL ONLY - JOBCENTER ONLY - NOT KEYBOARD OUTPUT - NO PUSH / NO DEPLOY / NO VERCEL / NO PAYMENT</div>
${markdownToHtml(markdown)}
</body>
</html>
`;

writeFileSync(htmlPath, html, "utf8");
rmSync(pdfPath, { force: true });
const pdfResult = spawnSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, fileUrl(htmlPath)], { encoding: "utf8" });
rmSync(htmlPath, { force: true });
if (pdfResult.status !== 0) {
  console.error(pdfResult.stderr || pdfResult.stdout || "Chrome PDF generation failed.");
  process.exit(pdfResult.status ?? 1);
}
if (!existsSync(pdfPath) || statSync(pdfPath).size <= 0) {
  console.error("Jobcenter PDF generation failed or produced an empty file.");
  process.exit(1);
}

let presentationCreatedBy = "";
try {
  presentationCreatedBy = createPresentationWithPowerPoint();
} catch (error) {
  if (!String(error.message).includes("PowerPoint")) {
    console.error(error.message);
    process.exit(1);
  }
  try {
    presentationCreatedBy = createPresentationWithLibreOffice();
  } catch (fallbackError) {
    console.error(fallbackError.message);
    process.exit(1);
  }
}

console.log("UAOS Jobcenter Send-Ready Generation");
console.log("Status: PASS");
console.log(`PDF: ${path.relative(root, pdfPath).replaceAll("\\", "/")} (${statSync(pdfPath).size} bytes)`);
console.log(`PPTX: ${path.relative(root, pptxPath).replaceAll("\\", "/")} (${statSync(pptxPath).size} bytes)`);
console.log(`Presentation created by: ${presentationCreatedBy}`);
if (existsSync(fallbackPdfPath)) console.log(`Presentation fallback PDF: ${path.relative(root, fallbackPdfPath).replaceAll("\\", "/")} (${statSync(fallbackPdfPath).size} bytes)`);
