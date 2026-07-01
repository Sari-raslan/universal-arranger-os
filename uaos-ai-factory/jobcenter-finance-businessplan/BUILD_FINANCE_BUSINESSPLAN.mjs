import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(process.cwd(), "../..");
const outDir = process.cwd();
const reportsDir = path.join(root, "uaos-ai-factory/implementation/reports");
const implDir = path.join(root, "uaos-ai-factory/implementation");
const dateIso = "2026-07-01";
const dateDe = "01.07.2026";
const applicant = "Sarey Raslan";
const liveMonitorUrl = "https://sari-raslan.github.io/universal-arranger-os/monitor/";
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const mdPath = path.join(outDir, "UAOS_FINANZ_BUSINESSPLAN_2026-07-01_DE.md");
const htmlPath = path.join(outDir, "UAOS_FINANZ_BUSINESSPLAN_2026-07-01_DE.html");
const pdfPath = path.join(outDir, "UAOS_FINANZ_BUSINESSPLAN_2026-07-01_DE.pdf");
const pptxPath = path.join(outDir, "UAOS_FINANZ_BUSINESSPLAN_2026-07-01_DE.pptx");
const fallbackPdfPath = path.join(outDir, "UAOS_FINANZ_BUSINESSPLAN_2026-07-01_DE_PRESENTATION_FALLBACK.pdf");
const zipPath = path.join(outDir, "UAOS_JOBCENTER_FINANCE_BUSINESSPLAN_SEND_READY_2026-07-01.zip");
const tempDir = path.join(outDir, ".finance-build-temp");

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function euro(value) {
  return `${value.toLocaleString("de-DE")} €`;
}

function writeJson(name, data) {
  writeFileSync(path.join(outDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  let inTable = false;
  let html = "";
  for (const line of lines) {
    if (line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
      if (!inTable) {
        html += "<table>\n";
        inTable = true;
      }
      const tag = html.endsWith("<table>\n") ? "th" : "td";
      html += `<tr>${cells.map((cell) => `<${tag}>${escapeHtml(cell)}</${tag}>`).join("")}</tr>\n`;
      continue;
    }
    if (inTable) {
      html += "</table>\n";
      inTable = false;
    }
    if (line.startsWith("# ")) html += `<h1>${escapeHtml(line.slice(2))}</h1>\n`;
    else if (line.startsWith("## ")) html += `<h2>${escapeHtml(line.slice(3))}</h2>\n`;
    else if (line.startsWith("### ")) html += `<h3>${escapeHtml(line.slice(4))}</h3>\n`;
    else if (line.startsWith("- ")) html += `<p class="bullet">&#8226; ${escapeHtml(line.slice(2))}</p>\n`;
    else if (!line.trim()) html += "\n";
    else html += `<p>${escapeHtml(line)}</p>\n`;
  }
  if (inTable) html += "</table>\n";
  return html;
}

function fileUrl(filePath) {
  return `file:///${filePath.replaceAll("\\", "/").replaceAll(" ", "%20")}`;
}

function psLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const assumptions = {
  date: dateIso,
  applicant,
  project: "UAOS / Universal Arranger OS / AE Platform",
  phase: "Projektentwicklungsphase",
  initialRevenueEur: 0,
  guaranteedIncome: false,
  incomeProjectionBinding: false,
  notes: [
    "Anfangsumsatz: 0 €",
    "Es wird kein Einkommen garantiert.",
    "Das Projekt befindet sich in der Entwicklungsphase.",
    "Spätere Pilot- oder Serviceeinnahmen sind nur als unverbindliche Möglichkeit dargestellt."
  ]
};

const startupBudget = [
  ["Laptop/Workstation", 1500, 2500, "verlässliche lokale Entwicklungs- und Dokumentationsumgebung"],
  ["Externer Monitor", 150, 300, "übersichtliche Arbeit mit Dokumentation, QA und Präsentationen"],
  ["Tastatur/Maus/Speicher/Zubehör", 150, 300, "grundlegende Arbeitsmittel und Datensicherung"],
  ["Software-/Dev-Tools-Reserve", 300, 600, "lokale Entwicklungs-, Test- und Dokumentationsreserve"],
  ["Dokumentation/Präsentation/Admin-Reserve", 100, 250, "Unterlagen, Nachweise und Verwaltungsaufwand"]
];

const monthlyCosts = [
  ["Software-/Services-Reserve", 30, 80],
  ["Internet-/Stromanteil", 20, 50],
  ["Backup/Speicher", 5, 20],
  ["Buchhaltung/Admin-Reserve", 20, 60]
];

const roadmap = [
  ["Q1", "Hardware, stabile lokale Entwicklung und Evidence-Aufbau"],
  ["Q2", "UI/Tooling, Live Monitor und Dokumentation"],
  ["Q3", "Library Factory, Oriental Strings Planung und Pilot-Demos"],
  ["Q4", "Validierung und sichere Produktrichtung ohne Produktionsfreigabe"]
];

const eigenleistung = {
  date: dateIso,
  hoursRange: { min: 450, max: 750 },
  internalHourlyValueEur: { min: 25, max: 45 },
  valueRangeEur: { min: 11250, max: 33750 },
  invoice: false,
  note: "Die Eigenleistung ist keine Rechnung und kein Zahlungsanspruch, sondern eine interne, konservative Selbstarbeitswert-Schätzung."
};

writeFileSync(path.join(outDir, "FINANCIAL_ASSUMPTIONS_2026-07-01_DE.md"), `# Finanzielle Annahmen

Datum: ${dateDe}

Antragsteller: ${applicant}

Projekt: UAOS / Universal Arranger OS / AE Platform

- Anfangsumsatz: 0 €
- Keine Einkommensgarantie.
- Aktuelle Phase: Projektentwicklungsphase.
- Spätere Pilot- oder Serviceeinnahmen sind nur als unverbindliche Projektion möglich.
- Es wird keine öffentliche Produktfreigabe, kein aktives Zahlungssystem und keine Keyboard-Ausgabe behauptet.
`, "utf8");
writeJson("FINANCIAL_ASSUMPTIONS_2026-07-01_DE.json", assumptions);

writeFileSync(path.join(outDir, "STARTUP_BUDGET_DE.md"), `# Startup-Budget / Arbeitsmittel

Datum: ${dateDe}

| Position | Planung min. | Planung max. | Zweck |
|---|---:|---:|---|
${startupBudget.map(([name, min, max, purpose]) => `| ${name} | ${euro(min)} | ${euro(max)} | ${purpose} |`).join("\n")}
| **Gesamt empfohlene Arbeitsmittel-Unterstützung** | **2.200 €** | **3.950 €** | konservativer Rahmen |
`, "utf8");
writeJson("STARTUP_BUDGET_DE.json", {
  date: dateIso,
  currency: "EUR",
  items: startupBudget.map(([name, min, max, purpose]) => ({ name, min, max, purpose })),
  totalRecommendedSupport: { min: 2200, max: 3950 }
});

writeFileSync(path.join(outDir, "MONTHLY_COST_PLAN_DE.md"), `# Monatlicher Kostenplan

Datum: ${dateDe}

| Position | Planung min. | Planung max. |
|---|---:|---:|
${monthlyCosts.map(([name, min, max]) => `| ${name} | ${euro(min)} | ${euro(max)} |`).join("\n")}
| **Monatliche Gesamtplanung** | **75 €** | **210 €** |

Die Werte sind konservative Planungswerte und keine Umsatz- oder Gewinnzusage.
`, "utf8");
writeJson("MONTHLY_COST_PLAN_DE.json", {
  date: dateIso,
  currency: "EUR",
  items: monthlyCosts.map(([name, min, max]) => ({ name, min, max })),
  totalMonthlyPlanning: { min: 75, max: 210 }
});

writeFileSync(path.join(outDir, "TWELVE_MONTH_ROADMAP_DE.md"), `# 12-Monats-Roadmap

Datum: ${dateDe}

| Quartal | Schwerpunkt |
|---|---|
${roadmap.map(([quarter, focus]) => `| ${quarter} | ${focus} |`).join("\n")}

Die Roadmap beschreibt Entwicklung, Validierung und Nachweise. Sie enthält keine Produktionsfreigabe.
`, "utf8");
writeJson("TWELVE_MONTH_ROADMAP_DE.json", {
  date: dateIso,
  quarters: roadmap.map(([quarter, focus]) => ({ quarter, focus })),
  productionClaim: false
});

writeFileSync(path.join(outDir, "EIGENLEISTUNG_VALUE_DE.md"), `# Eigenleistung

Datum: ${dateDe}

- Geschätzte Eigenleistung: 450–750 Stunden.
- Interner Bewertungsrahmen: 25–45 €/Stunde.
- Interner Wertkorridor: 11.250–33.750 €.
- Diese Bewertung ist keine Rechnung, kein Honoraranspruch und keine Einkommensgarantie.
- Sie zeigt nur den konservativ geschätzten Selbstarbeitswert der bisherigen Projektentwicklung.
`, "utf8");
writeJson("EIGENLEISTUNG_VALUE_DE.json", eigenleistung);

const businessplan = `# UAOS Finanz-Businessplan 2026-07-01

Datum: ${dateDe}

Businessplan-Datum: ${dateIso}

Antragsteller: ${applicant}

Projekt: UAOS / Universal Arranger OS / AE Platform

Live Monitor:
${liveMonitorUrl}

## Kurzbeschreibung

UAOS / Universal Arranger OS / AE Platform ist ein Softwareprojekt für musikalische Arbeitsabläufe, Arrangement-Planung, strukturierte Projektentwicklung und spätere sichere Tooling-Module. Der aktuelle Stand ist eine lokale Entwicklungs- und Nachweisphase mit dokumentierter Qualitätssicherung, klaren Sicherheitsgrenzen und einem öffentlichen Live Monitor zur Statusübersicht.

Das Projekt wird hier ausschließlich als Jobcenter-Unterlage beschrieben. Es wird keine öffentliche Produktfreigabe, kein aktives Zahlungssystem, kein Einkommen und keine Keyboard-Ausgabe behauptet.

## Aktueller Status

- Projektphase: Entwicklung, Dokumentation und Validierung.
- Anfangsumsatz: 0 €.
- Einkommensgarantie: nein.
- Live Monitor verifiziert: ${liveMonitorUrl}
- Ausgewähltes Review-Paket im Monitor: owner-neutral-003.
- Payment: nicht aktiviert.
- Keyboard-Ausgabe und Keyboard-Transfer: nicht freigegeben.
- Öffentlicher Produktverkauf: nicht behauptet.

## Finanzielle Annahmen

- Die Planung startet mit 0 € Umsatz.
- Spätere Pilot- oder Serviceeinnahmen sind nur als unverbindliche Möglichkeit einzuordnen.
- Die Zahlen sind bewusst konservativ und dienen der Plausibilisierung eines Arbeitsmittelbedarfs.
- Es gibt keine Zusage, dass Einnahmen entstehen.

## Startup-Budget / Antrag auf Arbeitsmittel-Unterstützung

| Position | Planung min. | Planung max. | Zweck |
|---|---:|---:|---|
${startupBudget.map(([name, min, max, purpose]) => `| ${name} | ${euro(min)} | ${euro(max)} | ${purpose} |`).join("\n")}
| **Gesamt empfohlene Arbeitsmittel-Unterstützung** | **2.200 €** | **3.950 €** | konservativer Rahmen |

Beantragt wird die Prüfung einer Arbeitsmittel-Unterstützung im konservativen Rahmen von 2.200–3.950 €, insbesondere für einen geeigneten Laptop oder eine Workstation sowie notwendige Basisarbeitsmittel.

## Monatlicher Kostenplan

| Position | Planung min. | Planung max. |
|---|---:|---:|
${monthlyCosts.map(([name, min, max]) => `| ${name} | ${euro(min)} | ${euro(max)} |`).join("\n")}
| **Monatliche Gesamtplanung** | **75 €** | **210 €** |

Die monatlichen Werte sind Planungswerte für eine vorsichtige Projektfortführung. Sie sind keine Gewinn-, Umsatz- oder Einkommenszusage.

## 12-Monats-Roadmap

| Quartal | Schwerpunkt |
|---|---|
${roadmap.map(([quarter, focus]) => `| ${quarter} | ${focus} |`).join("\n")}

Die Roadmap beschreibt die sichere Entwicklung und Validierung. Es wird keine Produktionsfreigabe behauptet.

## Eigenleistung

- Bisherige Eigenleistung: 450–750 Stunden.
- Interner Bewertungsrahmen: 25–45 €/Stunde.
- Interner Selbstarbeitswert: 11.250–33.750 €.
- Diese Bewertung ist keine Rechnung, kein Zahlungsanspruch und keine Einkommensgarantie.

Die Eigenleistung zeigt, dass bereits substanzielle Vorarbeit in Struktur, Dokumentation, lokale Prüfung, Statusaufbereitung und sichere Projektgrenzen investiert wurde.

## Risiken und Abgrenzung

- Kein garantiertes Einkommen.
- Kein aktives Zahlungssystem.
- Keine Keyboard-Ausgabe und kein Keyboard-Transfer.
- Keine öffentliche Produktfreigabe.
- Technische Entwicklung und Validierung können länger dauern als geplant.
- Die spätere Nachfrage nach Pilot- oder Serviceleistungen ist offen.
- Kosten werden konservativ geplant und müssen laufend geprüft werden.

## Bitte an das Jobcenter

Ich bitte um Prüfung einer Arbeitsmittel-Unterstützung für die weitere geordnete Projektentwicklung. Besonders wichtig ist ein verlässlicher Laptop oder eine Workstation, damit lokale Entwicklung, Dokumentation, QA, Präsentationen und weitere Nachweise stabil erstellt werden können.

Der Live Monitor dient als öffentlicher Statusnachweis:
${liveMonitorUrl}

## Schlussbemerkung

Dieser Finanz-Businessplan beschreibt eine konservative, sichere und nachvollziehbare Entwicklungsplanung zum ${dateDe}. Er enthält keine Einkommensgarantie, keine Zahlungsfreigabe, keine Produktionsfreigabe und keine Keyboard-Transfer-Freigabe.

UTF-8-Prüfzeichen: ä ö ü Ä Ö Ü ß.
`;

writeFileSync(mdPath, businessplan, "utf8");

const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>UAOS Finanz-Businessplan 2026-07-01</title>
  <style>
    @page { margin: 16mm; }
    body { font-family: Arial, "Segoe UI", sans-serif; color: #1f2933; line-height: 1.42; font-size: 10.5pt; }
    h1 { font-size: 22pt; color: #183b56; border-bottom: 3px solid #2f6f73; padding-bottom: 7pt; }
    h2 { font-size: 14pt; color: #2f6f73; margin-top: 15pt; }
    h3 { font-size: 12pt; color: #183b56; }
    p { margin: 5pt 0; }
    .bullet { margin-left: 12pt; }
    table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; page-break-inside: avoid; }
    th { background: #e8f1f2; color: #183b56; text-align: left; }
    th, td { border: 1px solid #a9bdc1; padding: 5pt; vertical-align: top; }
    .seal { border: 1px solid #9fb7bb; background: #f4f8f8; padding: 8pt; margin-bottom: 12pt; font-size: 9.5pt; }
  </style>
</head>
<body>
  <div class="seal">JOBCENTER ONLY - LOCAL BUILD - NO PAYMENT - NO KEYBOARD OUTPUT/TRANSFER - NO INCOME GUARANTEE</div>
${markdownToHtml(businessplan)}
</body>
</html>
`;

writeFileSync(htmlPath, html, "utf8");
rmSync(pdfPath, { force: true });
if (!existsSync(chrome)) throw new Error("Chrome not found for PDF generation.");
const pdfResult = spawnSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, fileUrl(htmlPath)], { encoding: "utf8" });
rmSync(htmlPath, { force: true });
if (pdfResult.status !== 0) throw new Error(pdfResult.stderr || pdfResult.stdout || "Chrome PDF generation failed.");
if (!existsSync(pdfPath) || statSync(pdfPath).size <= 0) throw new Error("PDF missing or empty.");

const slides = [
  { title: "UAOS Finanz-Businessplan", bullets: [`Jobcenter-Unterlage vom ${dateDe}`, `Antragsteller: ${applicant}`, "Projektentwicklungsphase mit konservativer Finanzplanung"] },
  { title: "Projekt und Status", bullets: ["UAOS / Universal Arranger OS / AE Platform", "Anfangsumsatz: 0 €", "Kein garantiertes Einkommen", "Keine öffentliche Produktfreigabe"] },
  { title: "Live Monitor", bullets: ["Öffentlicher Statusnachweis:", liveMonitorUrl, "Monitor zeigt Statuszahlen, Abschnittskarten, owner-neutral-003 und blockierte Bereiche"] },
  { title: "Startup-Budget", bullets: ["Laptop/Workstation: 1.500–2.500 €", "Externer Monitor: 150–300 €", "Tastatur/Maus/Speicher/Zubehör: 150–300 €", "Software/Dev-Tools: 300–600 €", "Dokumentation/Admin: 100–250 €", "Gesamt: 2.200–3.950 €"] },
  { title: "Monatlicher Kostenplan", bullets: ["Software/Services: 30–80 €", "Internet/Stromanteil: 20–50 €", "Backup/Speicher: 5–20 €", "Buchhaltung/Admin: 20–60 €", "Gesamt monatlich: 75–210 €"] },
  { title: "12-Monats-Roadmap", bullets: roadmap.map(([quarter, focus]) => `${quarter}: ${focus}`) },
  { title: "Eigenleistung", bullets: ["450–750 Stunden", "Interne Bewertung: 25–45 €/Stunde", "Wertkorridor: 11.250–33.750 €", "Keine Rechnung und keine Einkommensgarantie"] },
  { title: "Risiken", bullets: ["Keine garantierten Einnahmen", "Technische Validierung offen", "Pilot- oder Serviceeinnahmen nur unverbindliche Möglichkeit", "Kosten und Fortschritt müssen regelmäßig geprüft werden"] },
  { title: "Arbeitsmittel-Antrag", bullets: ["Prüfung einer Unterstützung im Rahmen von 2.200–3.950 €", "Ziel: stabile lokale Entwicklung, Dokumentation, QA und Präsentation", "Fokus auf Laptop/Workstation und notwendige Basisarbeitsmittel"] },
  { title: "Klare Grenzen", bullets: ["Payment: nein", "Keyboard-Ausgabe: nein", "Keyboard-Transfer: nein", "Keine Produktionsfreigabe", "Jobcenter-only Finanzunterlage"] }
];

rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });
writeJson(path.join(".finance-build-temp", "slides.json"), slides);
const psPath = path.join(tempDir, "create-finance-presentation.ps1");
const ps = `
$ErrorActionPreference = 'Stop'
$pptxPath = ${psLiteral(pptxPath)}
$fallbackPdfPath = ${psLiteral(fallbackPdfPath)}
$slidesPath = ${psLiteral(path.join(tempDir, "slides.json"))}
$slides = Get-Content -LiteralPath $slidesPath -Encoding UTF8 | ConvertFrom-Json
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
    $slide.Background.Fill.ForeColor.RGB = 15921906
    $bar = $slide.Shapes.AddShape(1, 0, 0, 960, 18)
    $bar.Fill.ForeColor.RGB = 755871
    $bar.Line.Visible = 0
    $accent = $slide.Shapes.AddShape(1, 0, 18, 960, 5)
    $accent.Fill.ForeColor.RGB = 7433075
    $accent.Line.Visible = 0
    $titleBox = $slide.Shapes.AddTextbox(1, 44, 42, 860, 58)
    $titleBox.TextFrame.TextRange.Text = [string]$slides[$i].Title
    $titleBox.TextFrame.TextRange.Font.Name = 'Arial'
    $titleBox.TextFrame.TextRange.Font.Size = 28
    $titleBox.TextFrame.TextRange.Font.Bold = -1
    $titleBox.TextFrame.TextRange.Font.Color.RGB = 2030358
    $bodyBox = $slide.Shapes.AddTextbox(1, 72, 126, 816, 340)
    $items = @($slides[$i].Bullets)
    $bodyText = [string]::Join([Environment]::NewLine, ($items | ForEach-Object { [char]0x2022 + ' ' + [string]$_ }))
    $bodyBox.TextFrame.TextRange.Text = $bodyText
    $bodyBox.TextFrame.TextRange.Font.Name = 'Arial'
    $bodyBox.TextFrame.TextRange.Font.Size = 18
    $bodyBox.TextFrame.TextRange.Font.Color.RGB = 3355443
    $bodyBox.TextFrame.MarginLeft = 8
    $bodyBox.TextFrame.MarginRight = 8
    $bodyBox.TextFrame.MarginTop = 8
    $bodyBox.TextFrame.MarginBottom = 8
    $footer = $slide.Shapes.AddTextbox(1, 44, 506, 860, 24)
    $footer.TextFrame.TextRange.Text = 'JOBCENTER ONLY - NO PAYMENT - NO KEYBOARD OUTPUT/TRANSFER - NO INCOME GUARANTEE'
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
rmSync(pptxPath, { force: true });
rmSync(fallbackPdfPath, { force: true });
const pptResult = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psPath], { encoding: "utf8" });
rmSync(tempDir, { recursive: true, force: true });
if (pptResult.status !== 0) throw new Error(pptResult.stderr || pptResult.stdout || "PowerPoint COM generation failed.");
if (!existsSync(pptxPath) || statSync(pptxPath).size <= 0) throw new Error("PPTX missing or empty.");
if (!existsSync(fallbackPdfPath) || statSync(fallbackPdfPath).size <= 0) throw new Error("Fallback PDF missing or empty.");

rmSync(zipPath, { force: true });
const zipResult = spawnSync("powershell", [
  "-NoProfile",
  "-Command",
  `$ErrorActionPreference='Stop'; Compress-Archive -LiteralPath ${psLiteral(pdfPath)},${psLiteral(pptxPath)},${psLiteral(fallbackPdfPath)} -DestinationPath ${psLiteral(zipPath)} -Force`
], { encoding: "utf8" });
if (zipResult.status !== 0) throw new Error(zipResult.stderr || zipResult.stdout || "ZIP creation failed.");
if (!existsSync(zipPath) || statSync(zipPath).size <= 0) throw new Error("ZIP missing or empty.");

writeFileSync(path.join(outDir, "FINANCE_BUSINESSPLAN_READY_SEAL.md"), `# Finance Businessplan Ready Seal

Datum: ${dateDe}

Status: PASS

Dateien:
- ${rel(pdfPath)}
- ${rel(pptxPath)}
- ${rel(fallbackPdfPath)}
- ${rel(zipPath)}

Live Monitor:
- ${liveMonitorUrl}

Sicherheitsstatus:
- Anfangsumsatz: 0 €
- Keine Einkommensgarantie: YES
- Payment aktiviert: NO
- Keyboard-Ausgabe/Transfer: NO
- Jobcenter-only: YES
- ZIP enthält nur PDF, PPTX und Fallback-PDF: YES
`, "utf8");
writeJson("FINANCE_BUSINESSPLAN_READY_SEAL.json", {
  date: dateIso,
  status: "PASS",
  pdf: rel(pdfPath),
  pptx: rel(pptxPath),
  fallbackPdf: rel(fallbackPdfPath),
  zip: rel(zipPath),
  liveMonitorUrl,
  initialRevenueEur: 0,
  incomeGuarantee: false,
  paymentEnabled: false,
  keyboardOutputOrTransfer: false,
  jobcenterOnly: true
});

mkdirSync(reportsDir, { recursive: true });
writeFileSync(path.join(reportsDir, "FINANCE_BUSINESSPLAN_PRO_RUN_REPORT.md"), `# Finance Businessplan Pro Run Report

Datum: ${dateDe}

Status: PASS

Erstellt:
- Finanzielle Annahmen
- Startup-Budget
- Monatlicher Kostenplan
- 12-Monats-Roadmap
- Eigenleistungsbewertung
- Finanz-Businessplan Markdown
- PDF
- PowerPoint COM PPTX
- PowerPoint COM Fallback-PDF
- Send-ready ZIP mit genau drei Dateien

Live Monitor:
- ${liveMonitorUrl}

Sicherheitsgrenzen:
- Kein Payment
- Keine Keyboard-Ausgabe
- Kein Keyboard-Transfer
- Keine Einkommensgarantie
- Keine Produktionsfreigabe
`, "utf8");
writeFileSync(path.join(implDir, "FINANCE_BUSINESSPLAN_PRO_RUN_SUMMARY.json"), `${JSON.stringify({
  date: dateIso,
  status: "PASS",
  pdf: rel(pdfPath),
  pptx: rel(pptxPath),
  fallbackPdf: rel(fallbackPdfPath),
  zip: rel(zipPath),
  liveMonitorUrl,
  powerpointComUsed: true,
  zipContainsOnlySendFiles: true,
  paymentEnabled: false,
  keyboardOutputOrTransfer: false,
  incomeGuarantee: false
}, null, 2)}\n`, "utf8");

console.log("UAOS Finance Businessplan Build");
console.log("Status: PASS");
console.log(`PDF: ${rel(pdfPath)} (${statSync(pdfPath).size} bytes)`);
console.log(`PPTX: ${rel(pptxPath)} (${statSync(pptxPath).size} bytes)`);
console.log(`Fallback PDF: ${rel(fallbackPdfPath)} (${statSync(fallbackPdfPath).size} bytes)`);
console.log(`ZIP: ${rel(zipPath)} (${statSync(zipPath).size} bytes)`);
