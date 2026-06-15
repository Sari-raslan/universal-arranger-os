import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const build = pkg.build || {};
const checks = {
  appName: Boolean(build.productName),
  executableMetadata: build.appId === "com.uaos.desktop",
  nsisTarget: JSON.stringify(build.win || {}).includes("nsis"),
  unpackedBuildTarget: fs.existsSync(path.join(root, "release", "win-unpacked")),
  packageFiles: Array.isArray(build.files) && build.files.includes("uaos-live-clean/dist/**/*"),
  frontendDist: fs.existsSync(path.join(root, "uaos-live-clean", "dist", "index.html")),
  licenseFoundation: fs.existsSync(path.join(root, "docs", "UAOS_PRIVACY_SUMMARY.md")) || fs.existsSync(path.join(root, "docs", "legal", "TERMS_DRAFT.md")),
  unsignedWarning: true,
  signedInstaller: false
};
const result = { schemaVersion: 1, generatedAt: new Date().toISOString(), passed: Object.entries(checks).filter(([key]) => key !== "signedInstaller").every(([, value]) => value), checks };
fs.writeFileSync(path.join(reportsDir, "UAOS_INSTALLER_CHECK.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(`UAOS installer check passed: ${result.passed}`);
if (!result.passed) process.exit(1);
