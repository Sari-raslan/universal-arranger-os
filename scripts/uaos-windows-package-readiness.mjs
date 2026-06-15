import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const ignoredDirectories = new Set([
  "node_modules",
  ".git",
  "dist",
  "release",
  "coverage",
]);

function walk(directory, depth = 0) {
  if (depth > 5 || !fs.existsSync(directory)) {
    return [];
  }

  const result = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      result.push(...walk(full, depth + 1));
    } else {
      result.push(full);
    }
  }

  return result;
}

const allFiles = walk(root);
const packageFiles = allFiles.filter(
  (file) => path.basename(file) === "package.json",
);

const packages = packageFiles.map((file) => {
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  const directory = path.dirname(file);
  const dependencies = {
    ...(value.dependencies || {}),
    ...(value.devDependencies || {}),
  };

  const mainCandidate = value.main
    ? path.resolve(directory, value.main)
    : null;

  return {
    file: path.relative(root, file).replaceAll("\\", "/"),
    directory,
    main: value.main || null,
    mainExists: Boolean(mainCandidate && fs.existsSync(mainCandidate)),
    electron: dependencies.electron || null,
    electronBuilder: dependencies["electron-builder"] || null,
    scripts: value.scripts || {},
    build: value.build || null,
  };
});

const electronInstalled = packages.some((item) => item.electron);
const builderInstalled = packages.some((item) => item.electronBuilder);

const mainEntries = packages
  .filter((item) => item.mainExists)
  .map((item) => ({
    package: item.file,
    main: item.main,
  }));

const discoveredElectronEntries = allFiles
  .filter((file) => /\.(cjs|mjs|js)$/i.test(file))
  .filter((file) => {
    const source = fs.readFileSync(file, "utf8");
    return (
      source.includes("BrowserWindow") &&
      source.includes("electron")
    );
  })
  .map((file) => path.relative(root, file).replaceAll("\\", "/"));

const frontendBuild = path.join(
  root,
  "uaos-live-clean",
  "dist",
  "index.html",
);

const iconCandidates = allFiles
  .filter((file) => /\.ico$/i.test(file))
  .map((file) => path.relative(root, file).replaceAll("\\", "/"));

const unpackedCandidates = [
  path.join(root, "release", "win-unpacked"),
  path.join(root, "dist", "win-unpacked"),
  path.join(root, "uaos-live-clean", "release", "win-unpacked"),
].filter((directory) => fs.existsSync(directory));

const entryReady =
  mainEntries.length > 0 ||
  discoveredElectronEntries.length > 0;

const frontendBuildReady = fs.existsSync(frontendBuild);

const codePackagingReady =
  electronInstalled &&
  builderInstalled &&
  entryReady &&
  frontendBuildReady;

const signingFlag =
  process.env.UAOS_WINDOWS_SIGNING_READY === "true";

const signedCommercialInstallerReady =
  codePackagingReady &&
  iconCandidates.length > 0 &&
  signingFlag;

const result = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  codePackagingReady,
  signedCommercialInstallerReady,
  electronInstalled,
  builderInstalled,
  entryReady,
  frontendBuildReady,
  packages,
  mainEntries,
  discoveredElectronEntries,
  iconCandidates,
  unpackedCandidates: unpackedCandidates.map((directory) =>
    path.relative(root, directory).replaceAll("\\", "/")
  ),
  signingFlag,
};

fs.writeFileSync(
  path.join(reportsDir, "UAOS_WINDOWS_PACKAGE_READINESS.json"),
  JSON.stringify(result, null, 2) + "\n",
  "utf8",
);

const mark = (value) => (value ? "[x]" : "[ ]");

const markdown = [
  "# UAOS Windows Package Readiness",
  "",
  `Generated: ${result.generatedAt}`,
  "",
  `${mark(electronInstalled)} Electron dependency detected`,
  `${mark(builderInstalled)} electron-builder dependency detected`,
  `${mark(entryReady)} Electron main entry detected`,
  `${mark(frontendBuildReady)} Frontend production build detected`,
  `${mark(iconCandidates.length > 0)} Windows ICO icon detected`,
  `${mark(signingFlag)} Windows signing approval enabled`,
  "",
  `Code packaging ready: ${codePackagingReady}`,
  `Signed commercial installer ready: ${signedCommercialInstallerReady}`,
  "",
  "## Electron entries",
  "",
  ...(mainEntries.length
    ? mainEntries.map((entry) => `- ${entry.package}: ${entry.main}`)
    : ["- No package main entry found"]),
  ...discoveredElectronEntries.map((entry) => `- Detected: ${entry}`),
  "",
  "## Unpacked builds",
  "",
  ...(result.unpackedCandidates.length
    ? result.unpackedCandidates.map((entry) => `- ${entry}`)
    : ["- No win-unpacked directory detected yet"]),
  "",
  "A code-ready unpacked build is not a signed commercial installer.",
  "",
].join("\n");

fs.writeFileSync(
  path.join(reportsDir, "UAOS_WINDOWS_PACKAGE_READINESS.md"),
  markdown,
  "utf8",
);

console.log(`Electron dependency: ${electronInstalled}`);
console.log(`electron-builder dependency: ${builderInstalled}`);
console.log(`Electron entry: ${entryReady}`);
console.log(`Frontend build: ${frontendBuildReady}`);
console.log(`Code packaging ready: ${codePackagingReady}`);
console.log(
  `Signed commercial installer ready: ${signedCommercialInstallerReady}`,
);

const strictSigned = process.argv.includes("--strict-signed");

if (!codePackagingReady) {
  process.exit(1);
}

if (strictSigned && !signedCommercialInstallerReady) {
  process.exit(2);
}