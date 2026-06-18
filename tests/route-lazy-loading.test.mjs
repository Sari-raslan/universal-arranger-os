import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("heavy UAOS screens use React lazy loading", () => {
  const app = fs.readFileSync(
    "uaos-live-clean/src/App.jsx",
    "utf8"
  );

  for (const name of [
    "DAWStudioPanel",
    "SamplerWorkbench",
    "AILabsPanel",
    "ProfessionalArrangerPanel",
    "HardwareIntegrationPanel",
    "CloudPlatformPanel",
    "PublicBetaPanel",
    "LibraryBrowser",
    "ArrangerEnginePanel",
    "SmartSequencerPage",
    "SetHardwareSequencerPanel"
  ]) {
    assert.match(app, new RegExp(`const ${name} = lazy`));
  }
});

test("root includes a Suspense fallback", () => {
  const main = fs.readFileSync(
    "uaos-live-clean/src/main.jsx",
    "utf8"
  );

  assert.match(main, /Suspense/);
  assert.match(main, /Loading UAOS module/);
});