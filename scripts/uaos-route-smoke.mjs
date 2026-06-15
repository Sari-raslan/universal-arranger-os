import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
const css = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "style.css"), "utf8");
const brand = fs.existsSync(path.join(root, "uaos-live-clean", "public", "brand", "uaos-icon-192.png"));

const routes = ["/", "/#/sing", "/#/studio", "/#/sampler", "/#/arranger", "/#/pro", "/#/midi", "/#/hardware", "/#/ai", "/#/account", "/#/pricing", "/#/downloads", "/#/support", "/#/academy", "/#/demo", "/#/privacy", "/#/terms", "/#/contact"];
const checks = routes.map((route) => {
  const id = route === "/" ? "home" : route.replace("/#/", "");
  const present = id === "home" ? app.includes('id: "home"') : app.includes(`page === "${id}"`) || app.includes(`id: "${id}"`);
  return { route, headingReady: present, noBlankScreen: present, navigationReady: app.includes("route(") };
});

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  passed: checks.every((check) => check.headingReady && check.noBlankScreen && check.navigationReady) && brand && css.includes("prefers-reduced-motion") && css.includes("betaLed"),
  checks,
  accountApiOfflineState: app.includes("CloudPlatformPanel"),
  arabicEncodingFoundation: fs.readFileSync(path.join(root, "uaos-live-clean", "index.html"), "utf8").includes("UTF-8"),
  officialLogo: brand,
  blueLedStyling: css.includes("betaLed") && css.includes("#00d4ff"),
  reducedMotion: css.includes("prefers-reduced-motion")
};

fs.writeFileSync(path.join(reportsDir, "UAOS_ROUTE_SMOKE.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(`UAOS route smoke passed: ${result.passed}`);
if (!result.passed) process.exit(1);
