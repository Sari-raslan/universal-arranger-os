/**
 * Independent Arranger Studio E2E (not V13 Mixer).
 * Routes musical intelligence through canonical Golden Brain.
 */
import { ArrangerEngine } from "../arranger-engine.js";
import { runPipeline } from "./musicalListeningPipeline.js";
import { runArrangerGoldenChain } from "../goldenBrain/arrangerChain.js";
import { GOLDEN_BRAIN_CONTRACT } from "../goldenBrain/goldenBrainCore.js";

export function arrangerStudioEndToEnd({ style = "Oriental Pop" } = {}) {
  const engine = new ArrangerEngine();
  engine.setTempo(96);
  engine.setSection("Intro");
  const chain = runArrangerGoldenChain({ style, tempo: 96, bars: 4 });
  const pipeline = runPipeline({ variant: "hijaz", includeArrangement: true });
  return {
    ok: chain.ok && pipeline.rendered.ok,
    engine: engine.setTempo(96),
    song: chain.sequencer?.sections || [],
    plan: chain.arrangement?.arrangement,
    intelligenceOk: chain.arrangement?.ok === true,
    pipelineOk: pipeline.rendered.ok,
    goldenBrainCapabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    v13Mixer: "READ_ONLY_DEPENDENCY",
    musicalQualityPass: false,
    capabilityId: "uaos.arranger-studio.e2e/v1"
  };
}
