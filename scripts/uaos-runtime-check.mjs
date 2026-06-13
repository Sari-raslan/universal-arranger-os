import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const requiredFiles = [
  "package.json",
  "electron/main.js",
  "uaos-live-clean/package.json",
  "uaos-live-clean/index.html",
  "uaos-live-clean/src/main.jsx",
  "uaos-live-clean/src/style.css",
  "scripts/UAOS_RUNTIME_START.ps1",
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required runtime file: ${relativePath}`);
  }
}

const rootPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const frontendPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, "uaos-live-clean", "package.json"), "utf8"));
const mainJs = fs.readFileSync(path.join(repoRoot, "electron", "main.js"), "utf8");
const mainJsx = fs.readFileSync(path.join(repoRoot, "uaos-live-clean", "src", "main.jsx"), "utf8");
const indexHtml = fs.readFileSync(path.join(repoRoot, "uaos-live-clean", "index.html"), "utf8");
const styleCss = fs.readFileSync(path.join(repoRoot, "uaos-live-clean", "src", "style.css"), "utf8");

if (rootPackage.main !== "electron/main.js") {
  throw new Error("Root package.json main must point to electron/main.js");
}

for (const scriptName of ["electron:dev", "electron:start", "runtime:check", "runtime:start"]) {
  if (!rootPackage.scripts?.[scriptName]) {
    throw new Error(`Missing root npm script: ${scriptName}`);
  }
}

if (!rootPackage.devDependencies?.electron) {
  throw new Error("Root package.json must include electron as a devDependency");
}

if (frontendPackage.scripts?.dev !== "vite --host 127.0.0.1 --port 5173") {
  throw new Error("Frontend dev script must bind Vite to 127.0.0.1:5173");
}

if (!mainJs.includes('backgroundColor: "#080d18"') || !mainJs.includes("contextIsolation: true")) {
  throw new Error("Electron BrowserWindow hardening settings are missing");
}

if (!mainJsx.includes('import "./style.css";') || !mainJsx.includes("RuntimeErrorBoundary")) {
  throw new Error("React runtime guard or style import is missing");
}

if (!indexHtml.includes('id="root"') || !indexHtml.includes('/src/main.jsx')) {
  throw new Error("index.html must mount #root and load /src/main.jsx");
}

if (!styleCss.includes("UAOS is loading")) {
  throw new Error("CSS loading fallback is missing");
}

console.log("UAOS runtime check passed");
