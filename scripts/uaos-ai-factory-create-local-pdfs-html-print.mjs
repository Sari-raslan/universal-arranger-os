import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputDir = path.join(root, "uaos-ai-factory/local-demo-evidence-pack/pdf-output");
const sourceMdDir = path.join(outputDir, "source-md");
const sourceHtmlDir = path.join(outputDir, "source-html");
const implementationDir = path.join(root, "uaos-ai-factory/implementation");
const reportsDir = path.join(implementationDir, "reports");

const files = [
  {
    key: "jobcenter",
    title: "UAOS Jobcenter Evidence Pack DE",
    lang: "de",
    dir: "ltr",
    md: "JOBCENTER_PDF_SOURCE_DE.md",
    html: "UAOS_JOBCENTER_EVIDENCE_PACK_DE.html",
    pdf: "UAOS_JOBCENTER_EVIDENCE_PACK_DE.pdf"
  },
  {
    key: "supporter",
    title: "UAOS Supporter Evidence Pack DE",
    lang: "de",
    dir: "ltr",
    md: "SUPPORTER_PDF_SOURCE_DE.md",
    html: "UAOS_SUPPORTER_EVIDENCE_PACK_DE.html",
    pdf: "UAOS_SUPPORTER_EVIDENCE_PACK_DE.pdf"
  },
  {
    key: "ownerArabic",
    title: "UAOS Owner Review Pack AR",
    lang: "ar",
    dir: "rtl",
    md: "OWNER_REVIEW_PDF_SOURCE_AR.md",
    html: "UAOS_OWNER_REVIEW_PACK_AR.html",
    pdf: "UAOS_OWNER_REVIEW_PACK_AR.pdf"
  },
  {
    key: "master",
    title: "UAOS Local Demo Evidence Master Pack",
    lang: "en",
    dir: "ltr",
    md: "MASTER_EVIDENCE_PDF_SOURCE.md",
    html: "UAOS_LOCAL_DEMO_EVIDENCE_MASTER_PACK.html",
    pdf: "UAOS_LOCAL_DEMO_EVIDENCE_MASTER_PACK.pdf"
  }
];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineCode(value) {
  return escapeHtml(value).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineCode(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!inList) return;
    html.push("</ul>");
    inList = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineCode(heading[2].trim())}</h${level}>`);
      continue;
    }

    const bullet = /^-\s+(.+)$/.exec(line.trim());
    if (bullet) {
      flushParagraph();
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineCode(bullet[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  return html.join("\n");
}

function htmlDocument({ title, lang, dir }, body) {
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 18mm; }
    body {
      font-family: Arial, "Segoe UI", sans-serif;
      color: #1f2933;
      line-height: 1.5;
      font-size: 11.5pt;
    }
    body[dir="rtl"] {
      font-family: Arial, "Segoe UI", Tahoma, sans-serif;
      text-align: right;
    }
    h1 {
      font-size: 22pt;
      margin: 0 0 12pt;
      border-bottom: 2px solid #2f6f73;
      padding-bottom: 8pt;
    }
    h2 {
      font-size: 15pt;
      margin-top: 18pt;
      color: #2f6f73;
    }
    h3, h4 {
      font-size: 12.5pt;
      margin-top: 14pt;
      color: #30424c;
    }
    p { margin: 7pt 0; }
    ul { margin: 6pt 0 10pt 18pt; }
    li { margin: 4pt 0; }
    code {
      font-family: Consolas, monospace;
      background: #eef3f4;
      padding: 1pt 3pt;
      border-radius: 3pt;
    }
    .safety {
      border: 1px solid #9fb7bb;
      background: #f4f8f8;
      padding: 8pt;
      margin-bottom: 14pt;
      font-size: 10pt;
    }
  </style>
</head>
<body dir="${dir}">
  <div class="safety">LOCAL ONLY - READ ONLY - NOT PUBLIC RELEASE - NOT KEYBOARD OUTPUT</div>
${body}
</body>
</html>
`;
}

function findBrowser() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function fileUrl(filePath) {
  return `file:///${filePath.replaceAll("\\", "/").replaceAll(" ", "%20")}`;
}

ensureDir(outputDir);
ensureDir(sourceMdDir);
ensureDir(sourceHtmlDir);
ensureDir(reportsDir);

const browser = findBrowser();
if (!browser) {
  console.error("Local Chrome/Edge not found. HTML sources created but PDFs not created.");
}

const created = [];
for (const item of files) {
  const mdPath = path.join(sourceMdDir, item.md);
  if (!existsSync(mdPath)) {
    console.error(`Missing source markdown: ${mdPath}`);
    process.exit(1);
  }
  const markdown = readFileSync(mdPath, "utf8");
  const htmlPath = path.join(sourceHtmlDir, item.html);
  writeFileSync(htmlPath, htmlDocument(item, markdownToHtml(markdown)));
  created.push({ ...item, mdPath, htmlPath, pdfPath: path.join(outputDir, item.pdf) });
}

if (!browser) process.exit(1);

for (const item of created) {
  const result = spawnSync(browser, [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${item.pdfPath}`,
    fileUrl(item.htmlPath)
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || `Browser print failed for ${item.pdf}`);
    process.exit(result.status ?? 1);
  }
  if (!existsSync(item.pdfPath) || statSync(item.pdfPath).size <= 0) {
    console.error(`PDF was not created or is empty: ${item.pdfPath}`);
    process.exit(1);
  }
}

const creationTime = new Date().toISOString();
const manifest = {
  schema: "uaos-local-browser-pdf-output-manifest-v1",
  status: "PASS",
  creationTime,
  browserUsed: browser,
  outputs: created.map((item) => ({
    pdfPath: path.relative(root, item.pdfPath).replaceAll("\\", "/"),
    htmlSourcePath: path.relative(root, item.htmlPath).replaceAll("\\", "/"),
    mdSourcePath: path.relative(root, item.mdPath).replaceAll("\\", "/"),
    fileSizeBytes: statSync(item.pdfPath).size
  })),
  safetyLabels: [
    "LOCAL ONLY",
    "READ ONLY",
    "NOT PUBLIC RELEASE",
    "NOT KEYBOARD OUTPUT",
    "no keyboard output",
    "no deploy",
    "no payment",
    "no public release"
  ]
};

writeFileSync(path.join(outputDir, "PDF_OUTPUT_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(path.join(outputDir, "PDF_OUTPUT_MANIFEST.md"), `# PDF Output Manifest

Status: PASS

Creation time: ${creationTime}

Browser used: ${browser}

Safety labels:
- LOCAL ONLY
- READ ONLY
- NOT PUBLIC RELEASE
- NOT KEYBOARD OUTPUT
- No keyboard output
- No deploy
- No payment
- No public release

## PDF Outputs

${manifest.outputs.map((item) => `- ${item.pdfPath} (${item.fileSizeBytes} bytes)\n  - HTML: ${item.htmlSourcePath}\n  - MD: ${item.mdSourcePath}`).join("\n")}
`);

writeFileSync(path.join(reportsDir, "PDF_003R_LOCAL_BROWSER_PDF_CREATION_REPORT.md"), `# PDF-003R Local Browser PDF Creation Report

Status: PASS

Created four local PDF files via local HTML generation and browser print.

Browser used: ${browser}

Safety result:
- Local only: YES
- No deploy: YES
- No payment: YES
- No public release: YES
- Keyboard output created: NO
- Keyboard transfer allowed: NO
`);

writeFileSync(path.join(implementationDir, "PDF_003R_LOCAL_BROWSER_PDF_CREATION_SUMMARY.json"), `${JSON.stringify({
  schema: "uaos-pdf-recovery-stage-summary-v1",
  stage: "PDF-003R",
  status: "PASS",
  browserUsed: browser,
  outputs: manifest.outputs,
  safety: {
    localOnly: true,
    deploy: false,
    payment: false,
    publicRelease: false,
    keyboardOutputCreated: false,
    keyboardTransferAllowed: false
  }
}, null, 2)}\n`);

console.log("UAOS Local Browser PDF Creation");
console.log(`Status: PASS`);
console.log(`Browser used: ${browser}`);
for (const item of manifest.outputs) {
  console.log(`${item.pdfPath}: ${item.fileSizeBytes} bytes`);
}
