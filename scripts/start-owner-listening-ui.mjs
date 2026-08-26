import { spawn } from "node:child_process";
import { startOwnerListeningUi } from "./owner-listening-ui.mjs";

const { url, port } = await startOwnerListeningUi();
console.log(`OWNER_LISTENING_UI ${url}`);
console.log(`port=${port}`);
console.log("WAV files are read-only. Playback is not PASS. Not a Program Tree controller.");

if (!process.argv.includes("--no-open")) {
  spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  console.log("Opened default browser for owner listening.");
}
