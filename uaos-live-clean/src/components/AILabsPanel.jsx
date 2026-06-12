import { analyzeSignal } from "../ai/analysisPipeline.js";
import { createArrangementPlan } from "../ai/arrangementPlanner.js";
import { evaluateArrangement } from "../ai/evaluation.js";
import { createRuleBasedGenerator, validateGeneratedMidi } from "../ai/generators.js";
import { StatusBadge } from "./StatusBadge.jsx";

export function AILabsPanel() {
  const analysis = analyzeSignal(new Float32Array([0, 0.1, 0.2, 0.1, 0]), 1000);
  const plan = createArrangementPlan({ tempo: 96, key: "Cm", genre: "original" });
  const generator = createRuleBasedGenerator();
  const events = generator.generate(plan);
  const validation = validateGeneratedMidi(events, plan);
  const evaluation = evaluateArrangement(events, plan);

  return (
    <section className="panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">V3 AI Arranger Labs <StatusBadge status="experimental" /></p>
          <h2>Rule-based local pipeline</h2>
        </div>
      </div>
      <div className="cards three">
        <article className="card"><h3>Analysis</h3><p>Version: {analysis.version}</p><p>RMS confidence {Math.round(analysis.dynamics.confidence * 100)}%</p></article>
        <article className="card"><h3>Planner</h3><p>{plan.structure.length} sections, {plan.lanes.length} lanes</p><p>Cloud: optional only</p></article>
        <article className="card"><h3>Generator</h3><p>{events.length} MIDI events</p><p>{validation.ok ? "Range safe" : validation.error}</p></article>
      </div>
      <p>Evaluation: timing {evaluation.timingValidity ? "valid" : "invalid"}, range {evaluation.rangeValidity ? "valid" : "invalid"}</p>
    </section>
  );
}
