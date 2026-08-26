/**
 * Studio Pro surface contract — offline panels + bundle.
 */
import { buildStudioProBundle } from "./studioProBundle.js";
import { createTransport, transportCommand } from "../render/goldenSequencerTransport.js";
import { createMusicalSessionMemory } from "../session/musicalSessionMemory.js";

export function studioProSurface({ storage, title = "Studio Pro Surface" } = {}) {
  const bundle = buildStudioProBundle({ title, tempo: 96, storage });
  let transport = createTransport({ tempo: 96 });
  transport = transportCommand(transport, "play").transport;
  transport = transportCommand(transport, "pause").transport;
  transport = transportCommand(transport, "stop").transport;
  const memory = createMusicalSessionMemory({ storage });
  const panels = [
    { id: "arrange", ready: true },
    { id: "transport", ready: transport.state === "stopped" },
    { id: "export", ready: bundle.ok },
    { id: "session", ready: Boolean(memory.snapshot().hasProject) }
  ];
  return {
    ok: bundle.ok && panels.every((p) => p.ready),
    panels,
    transport,
    bundleSha256: bundle.sha256,
    commercialReady: false,
    musicalQualityPass: false,
    capabilityId: "uaos.studio-pro.surface/v1"
  };
}
