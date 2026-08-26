/**
 * Independent Arranger Studio E2E (not V13 Mixer).
 * Mixer contract stays READ_ONLY_DEPENDENCY.
 */
import { SongArranger } from "../song-arranger.js";
import { ArrangerEngine } from "../arranger-engine.js";
import { buildArrangementPlan } from "../arranger/personalized-arranger.js";
import { analyzeArrangementIntelligence } from "../arranger/arrangementIntelligence.js";
import { runPipeline } from "./musicalListeningPipeline.js";

export function arrangerStudioEndToEnd({ style = "Oriental Pop" } = {}) {
  const engine = new ArrangerEngine();
  engine.setTempo(96);
  engine.setSection("Intro");
  const song = new SongArranger().generate(style);
  const plan = buildArrangementPlan({
    melody: "60,61,64,65",
    tasteProfile: { genres: "arabic khaleeji" }
  });
  const intelligence = analyzeArrangementIntelligence({});
  const pipeline = runPipeline({ variant: "hijaz", includeArrangement: true });
  return {
    ok: song.ok && plan.ok && intelligence.ok && pipeline.rendered.ok,
    engine: engine.setTempo(96),
    song: song.song,
    plan: plan.arrangement,
    intelligenceOk: intelligence.ok,
    pipelineOk: pipeline.rendered.ok,
    v13Mixer: "READ_ONLY_DEPENDENCY",
    musicalQualityPass: false,
    capabilityId: "uaos.arranger-studio.e2e/v1"
  };
}
