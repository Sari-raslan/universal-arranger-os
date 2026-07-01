import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputDir = path.join(root, "uaos-ai-factory/local-demo-evidence-pack/ppt-output");
const sourceMdDir = path.join(outputDir, "source-md");
const tempDir = path.join(outputDir, "temp-build");
const implementationDir = path.join(root, "uaos-ai-factory/implementation");
const reportsDir = path.join(implementationDir, "reports");

const decks = [
  { title: "UAOS Jobcenter Evidence Pack DE", file: "UAOS_JOBCENTER_EVIDENCE_PACK_DE.pptx", source: "JOBCENTER_PPT_SOURCE_DE.md" },
  { title: "UAOS Supporter Evidence Pack DE", file: "UAOS_SUPPORTER_EVIDENCE_PACK_DE.pptx", source: "SUPPORTER_PPT_SOURCE_DE.md" },
  { title: "UAOS Owner Review Pack AR", file: "UAOS_OWNER_REVIEW_PACK_AR.pptx", source: "OWNER_REVIEW_PPT_SOURCE_AR.md" },
  { title: "UAOS Local Demo Evidence Master Pack", file: "UAOS_LOCAL_DEMO_EVIDENCE_MASTER_PACK.pptx", source: "MASTER_EVIDENCE_PPT_SOURCE.md" }
];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function parseMarkdown(markdown, title) {
  const bullets = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).replaceAll("`", ""));
  const safety = bullets.filter((line) => /no |local|read only|not public|not keyboard|لا يوجد|محلية/i.test(line));
  const review = bullets.filter((line) => !safety.includes(line));
  return [
    { title, bullets: ["LOCAL ONLY", "READ ONLY", "NOT PUBLIC RELEASE", "NOT KEYBOARD OUTPUT"] },
    { title: "Safety Boundaries", bullets: safety.slice(0, 7) },
    { title: "Review Evidence", bullets: review.slice(0, 7) },
    { title: "Manual Review State", bullets: ["PowerPoint created locally only", "No push, deploy, Vercel, or payment", "No proprietary content copied", "Keyboard transfer remains NO", "Ready for manual PPT review"] }
  ].map((slide) => ({ ...slide, bullets: slide.bullets.length ? slide.bullets : ["Local private review material only"] }));
}

function slideXml(slide, index) {
  const body = slide.bullets.map((bullet, bulletIndex) => `
        <a:p>
          <a:pPr marL="${bulletIndex ? 342900 : 0}" indent="0"><a:buChar char="•"/></a:pPr>
          <a:r><a:rPr lang="en-US" sz="2200"/><a:t>${xml(bullet)}</a:t></a:r>
        </a:p>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${index * 10 + 1}" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="304800"/><a:ext cx="8229600" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
        <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="3400" b="1"/><a:t>${xml(slide.title)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${index * 10 + 2}" name="Body"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="685800" y="1524000"/><a:ext cx="7772400" cy="4572000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
        <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${body}</p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${index * 10 + 3}" name="Footer"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="6400800"/><a:ext cx="8229600" cy="304800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
        <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1200"/><a:t>LOCAL ONLY - NOT KEYBOARD OUTPUT - NO PUSH / NO DEPLOY / NO VERCEL</a:t></a:r></a:p></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function contentTypes(slideCount) {
  const slideOverrides = Array.from({ length: slideCount }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideOverrides}
</Types>`;
}

function presentationXml(slideCount) {
  const ids = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 1}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>${ids}</p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

function presentationRels(slideCount) {
  const slideRels = Array.from({ length: slideCount }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${slideRels}
  <Relationship Id="rId${slideCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;
}

function rootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function themeXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="UAOS Local"><a:themeElements><a:clrScheme name="UAOS"><a:dk1><a:srgbClr val="1F2933"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="30424C"/></a:dk2><a:lt2><a:srgbClr val="EEF3F4"/></a:lt2><a:accent1><a:srgbClr val="2F6F73"/></a:accent1><a:accent2><a:srgbClr val="7A9E7E"/></a:accent2><a:accent3><a:srgbClr val="C19A5B"/></a:accent3><a:accent4><a:srgbClr val="5C6B73"/></a:accent4><a:accent5><a:srgbClr val="8A6F8F"/></a:accent5><a:accent6><a:srgbClr val="D17A62"/></a:accent6><a:hlink><a:srgbClr val="2F6F73"/></a:hlink><a:folHlink><a:srgbClr val="5C6B73"/></a:folHlink></a:clrScheme><a:fontScheme name="UAOS"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="UAOS"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
}

function createDeck(deck) {
  const mdPath = path.join(sourceMdDir, deck.source);
  if (!existsSync(mdPath)) throw new Error(`Missing source markdown: ${rel(mdPath)}`);
  const slides = parseMarkdown(readFileSync(mdPath, "utf8"), deck.title);
  const deckName = deck.file.replace(/\.pptx$/i, "");
  const deckDir = path.join(tempDir, deckName);
  const zipPath = path.join(outputDir, `${deckName}.zip`);
  const pptxPath = path.join(outputDir, deck.file);
  rmSync(deckDir, { recursive: true, force: true });
  rmSync(zipPath, { force: true });
  rmSync(pptxPath, { force: true });
  ensureDir(path.join(deckDir, "_rels"));
  ensureDir(path.join(deckDir, "docProps"));
  ensureDir(path.join(deckDir, "ppt/_rels"));
  ensureDir(path.join(deckDir, "ppt/slides"));
  ensureDir(path.join(deckDir, "ppt/theme"));

  writeFileSync(path.join(deckDir, "[Content_Types].xml"), contentTypes(slides.length));
  writeFileSync(path.join(deckDir, "_rels/.rels"), rootRels());
  writeFileSync(path.join(deckDir, "docProps/app.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>UAOS Local PPT Generator</Application><Slides>${slides.length}</Slides></Properties>`);
  writeFileSync(path.join(deckDir, "docProps/core.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${xml(deck.title)}</dc:title><dc:creator>UAOS Local</dc:creator></cp:coreProperties>`);
  writeFileSync(path.join(deckDir, "ppt/presentation.xml"), presentationXml(slides.length));
  writeFileSync(path.join(deckDir, "ppt/_rels/presentation.xml.rels"), presentationRels(slides.length));
  writeFileSync(path.join(deckDir, "ppt/theme/theme1.xml"), themeXml());
  slides.forEach((slide, index) => writeFileSync(path.join(deckDir, `ppt/slides/slide${index + 1}.xml`), slideXml(slide, index + 1)));

  const ps = spawnSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${deckDir}\\*' -DestinationPath '${zipPath}' -Force`], { encoding: "utf8" });
  if (ps.status !== 0) throw new Error(ps.stderr || ps.stdout || `Compress-Archive failed for ${deck.file}`);
  if (!existsSync(zipPath) || statSync(zipPath).size <= 0) throw new Error(`ZIP archive missing or empty for ${deck.file}`);
  copyFileSync(zipPath, pptxPath);
  if (!existsSync(pptxPath) || statSync(pptxPath).size <= 0) throw new Error(`PPTX missing or empty after zip-to-pptx copy: ${deck.file}`);
  unlinkSync(zipPath);
  return { pptxPath: rel(pptxPath), sourceMdPath: rel(mdPath), fileSizeBytes: statSync(pptxPath).size, slideCount: slides.length };
}

ensureDir(outputDir);
ensureDir(sourceMdDir);
ensureDir(reportsDir);
ensureDir(implementationDir);
rmSync(tempDir, { recursive: true, force: true });
ensureDir(tempDir);

const outputs = decks.map(createDeck);
rmSync(tempDir, { recursive: true, force: true });

const manifest = {
  schema: "uaos-local-ppt-output-manifest-v1",
  status: "PASS",
  creationTime: new Date().toISOString(),
  generator: "Node built-ins plus local PowerShell Compress-Archive zip-to-pptx recovery",
  outputs,
  safetyLabels: ["LOCAL ONLY", "READ ONLY", "NOT PUBLIC RELEASE", "NOT KEYBOARD OUTPUT", "no keyboard transfer", "no payment", "no deploy", "no Vercel", "no proprietary content"]
};

writeFileSync(path.join(outputDir, "PPT_OUTPUT_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(path.join(outputDir, "PPT_OUTPUT_MANIFEST.md"), `# PPT Output Manifest

Status: PASS

Creation time: ${manifest.creationTime}

Generator: ${manifest.generator}

Safety labels:
- LOCAL ONLY
- READ ONLY
- NOT PUBLIC RELEASE
- NOT KEYBOARD OUTPUT
- No keyboard transfer
- No payment
- No deploy
- No Vercel
- No proprietary content

## PPTX Outputs

${outputs.map((item) => `- ${item.pptxPath} (${item.fileSizeBytes} bytes, ${item.slideCount} slides)\n  - Source: ${item.sourceMdPath}`).join("\n")}
`);

writeFileSync(path.join(reportsDir, "PPT_002R_GENERATOR_ZIP_TO_PPTX_FIX_REPORT.md"), `# PPT-002R Generator Zip-To-PPTX Fix Report

Status: PASS

Updated the local PowerPoint generator to create a .zip archive first, copy it to the final .pptx path, verify the .pptx exists with nonzero size, and remove the temporary .zip.

Safety result:
- Local only: YES
- Package install: NO
- Internet use: NO
- Keyboard output created: NO
- Keyboard transfer allowed: NO
`);
writeFileSync(path.join(implementationDir, "PPT_002R_GENERATOR_ZIP_TO_PPTX_FIX_SUMMARY.json"), `${JSON.stringify({ schema: "uaos-ppt-recovery-stage-summary-v1", stage: "PPT-002R", status: "PASS", zipToPptxRenameFixUsed: true, safety: { localOnly: true, packageInstall: false, internetUse: false, keyboardOutputCreated: false, keyboardTransferAllowed: false } }, null, 2)}\n`);
writeFileSync(path.join(reportsDir, "PPT_003R_LOCAL_PPTX_CREATION_REPORT.md"), `# PPT-003R Local PPTX Creation Report

Status: PASS

Created four local PowerPoint files using the zip-to-pptx recovery flow.

${outputs.map((item) => `- ${item.pptxPath}: ${item.fileSizeBytes} bytes`).join("\n")}

Safety result:
- Local only: YES
- Keyboard output created: NO
- Keyboard transfer allowed: NO
- Push/deploy/Vercel/payment: NO
`);
writeFileSync(path.join(implementationDir, "PPT_003R_LOCAL_PPTX_CREATION_SUMMARY.json"), `${JSON.stringify({ schema: "uaos-ppt-recovery-stage-summary-v1", stage: "PPT-003R", status: "PASS", outputs, safety: { localOnly: true, keyboardOutputCreated: false, keyboardTransferAllowed: false, pushDeployVercelPayment: false } }, null, 2)}\n`);

console.log("UAOS Local PPTX Creation");
console.log("Status: PASS");
for (const output of outputs) console.log(`${output.pptxPath}: ${output.fileSizeBytes} bytes`);
