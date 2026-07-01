import { existsSync, mkdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packDir = path.join(root, "uaos-ai-factory/jobcenter-send-ready");
const sourceMd = path.join(packDir, "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.md");
const htmlPath = path.join(packDir, "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.html");
const pdfPath = path.join(packDir, "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.pdf");
const pptxPath = path.join(packDir, "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.pptx");
const tempDir = path.join(packDir, "temp-pptx-build");
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
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

function slideText(markdown) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const title = lines.find((line) => line.startsWith("# "))?.slice(2) ?? "UAOS Jobcenter Businessplan";
  const bullets = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).replaceAll("`", ""))
    .slice(0, 16);
  return [
    { title, bullets: ["Datum: 01.07.2026", "Jobcenter-only", "Lokaler privater Prototyp", "Nicht öffentlich live"] },
    { title: "Aktueller Projektstand", bullets: bullets.slice(0, 6) },
    { title: "Projekt-Monitor", bullets: ["wird nach Freigabe des Uploads aktiviert", "Der Link ist derzeit noch nicht öffentlich live", "Kein Upload, kein Push und kein Deploy freigegeben"] },
    { title: "Sicherheitsgrenzen", bullets: ["Kein Payment", "Kein Deploy", "Kein Vercel", "Keine Keyboard-native Ausgabe", "Kein Keyboard Transfer"] }
  ];
}

function slideXml(slide, index) {
  const body = slide.bullets.map((bullet) => `
        <a:p>
          <a:pPr marL="342900" indent="0"><a:buChar char="•"/></a:pPr>
          <a:r><a:rPr lang="de-DE" sz="2200"/><a:t>${escapeXml(bullet)}</a:t></a:r>
        </a:p>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    <p:sp><p:nvSpPr><p:cNvPr id="${index * 10 + 1}" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="457200" y="304800"/><a:ext cx="8229600" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="de-DE" sz="3300" b="1"/><a:t>${escapeXml(slide.title)}</a:t></a:r></a:p></p:txBody></p:sp>
    <p:sp><p:nvSpPr><p:cNvPr id="${index * 10 + 2}" name="Body"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="1524000"/><a:ext cx="7772400" cy="4572000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${body}</p:txBody></p:sp>
    <p:sp><p:nvSpPr><p:cNvPr id="${index * 10 + 3}" name="Footer"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="457200" y="6400800"/><a:ext cx="8229600" cy="304800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="de-DE" sz="1200"/><a:t>LOCAL ONLY - JOBCENTER ONLY - NOT KEYBOARD OUTPUT</a:t></a:r></a:p></p:txBody></p:sp>
  </p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function contentTypes(slideCount) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slides}</Types>`;
}

function presentationXml(slideCount) {
  const ids = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 1}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>${ids}</p:sldIdLst><p:sldSz cx="9144000" cy="6858000" type="screen4x3"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
}

function presentationRels(slideCount) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${slides}<Relationship Id="rId${slideCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>`;
}

function writePptx(markdown) {
  const slides = slideText(markdown);
  const deckDir = path.join(tempDir, "jobcenter-pptx");
  const zipPath = path.join(packDir, "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.zip");
  rmSync(tempDir, { recursive: true, force: true });
  rmSync(zipPath, { force: true });
  rmSync(pptxPath, { force: true });
  ensureDir(path.join(deckDir, "_rels"));
  ensureDir(path.join(deckDir, "docProps"));
  ensureDir(path.join(deckDir, "ppt/_rels"));
  ensureDir(path.join(deckDir, "ppt/slides"));
  ensureDir(path.join(deckDir, "ppt/theme"));
  writeFileSync(path.join(deckDir, "[Content_Types].xml"), contentTypes(slides.length), "utf8");
  writeFileSync(path.join(deckDir, "_rels/.rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`, "utf8");
  writeFileSync(path.join(deckDir, "docProps/app.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>UAOS Jobcenter UTF-8 Generator</Application><Slides>${slides.length}</Slides></Properties>`, "utf8");
  writeFileSync(path.join(deckDir, "docProps/core.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>UAOS Jobcenter Präsentation</dc:title><dc:creator>UAOS Local</dc:creator></cp:coreProperties>`, "utf8");
  writeFileSync(path.join(deckDir, "ppt/presentation.xml"), presentationXml(slides.length), "utf8");
  writeFileSync(path.join(deckDir, "ppt/_rels/presentation.xml.rels"), presentationRels(slides.length), "utf8");
  writeFileSync(path.join(deckDir, "ppt/theme/theme1.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="UAOS Jobcenter"><a:themeElements><a:clrScheme name="UAOS"><a:dk1><a:srgbClr val="1F2933"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="30424C"/></a:dk2><a:lt2><a:srgbClr val="EEF3F4"/></a:lt2><a:accent1><a:srgbClr val="2F6F73"/></a:accent1><a:accent2><a:srgbClr val="7A9E7E"/></a:accent2><a:accent3><a:srgbClr val="C19A5B"/></a:accent3><a:accent4><a:srgbClr val="5C6B73"/></a:accent4><a:accent5><a:srgbClr val="8A6F8F"/></a:accent5><a:accent6><a:srgbClr val="D17A62"/></a:accent6><a:hlink><a:srgbClr val="2F6F73"/></a:hlink><a:folHlink><a:srgbClr val="5C6B73"/></a:folHlink></a:clrScheme><a:fontScheme name="UAOS"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="UAOS"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`, "utf8");
  slides.forEach((slide, index) => writeFileSync(path.join(deckDir, `ppt/slides/slide${index + 1}.xml`), slideXml(slide, index + 1), "utf8"));
  const ps = spawnSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${deckDir}\\*' -DestinationPath '${zipPath}' -Force`], { encoding: "utf8" });
  if (ps.status !== 0) throw new Error(ps.stderr || ps.stdout || "PowerShell Compress-Archive failed.");
  if (!existsSync(zipPath) || statSync(zipPath).size <= 0) throw new Error("PPTX zip archive missing or empty.");
  copyFileSync(zipPath, pptxPath);
  unlinkSync(zipPath);
  rmSync(tempDir, { recursive: true, force: true });
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

try {
  writePptx(markdown);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
if (!existsSync(pptxPath) || statSync(pptxPath).size <= 0) {
  console.error("Jobcenter PPTX generation failed or produced an empty file.");
  process.exit(1);
}

console.log("UAOS Jobcenter Send-Ready Generation");
console.log("Status: PASS");
console.log(`PDF: ${path.relative(root, pdfPath).replaceAll("\\", "/")} (${statSync(pdfPath).size} bytes)`);
console.log(`PPTX: ${path.relative(root, pptxPath).replaceAll("\\", "/")} (${statSync(pptxPath).size} bytes)`);
