/**
 * Automated Musical Brain / Arranger quality gates.
 * These catch obvious technical failures. They do NOT claim human taste PASS.
 */
import { pitchClasses, scoreAlternative, HIJAZ_PITCH_CLASSES } from "./tonalContext.js";

export function sectionContinuity(sections = []) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return { ok: false, errorCode: "NO_SECTIONS" };
  }
  const names = sections.map((s) => String(s.name || s.section || "").trim()).filter(Boolean);
  const unique = new Set(names);
  const bars = sections.map((s) => Number(s.bars) || 0);
  const gaps = bars.filter((b) => b <= 0).length;
  return {
    ok: names.length === sections.length && unique.size === names.length && gaps === 0,
    sectionCount: sections.length,
    uniqueNames: unique.size,
    zeroBarSections: gaps,
    musicalQualityClaim: false
  };
}

export function arrangementContextPreservation(sourceArrangement, candidateArrangement) {
  const sourceNames = (sourceArrangement?.sections || []).map((s) => s.name || s.section);
  const candidateNames = (candidateArrangement?.sections || []).map((s) => s.name || s.section);
  const missing = sourceNames.filter((n) => !candidateNames.includes(n));
  const orderOk = sourceNames.every((n, i) => !candidateNames[i] || candidateNames[i] === n || candidateNames.includes(n));
  return {
    ok: missing.length === 0 && orderOk,
    missing,
    orderOk,
    musicalQualityClaim: false
  };
}

export function noObviousOutOfScaleCollisions(melody = [], allowedPitchClasses = HIJAZ_PITCH_CLASSES) {
  const allowed = new Set(allowedPitchClasses);
  const collisions = melody.filter((m) => !allowed.has(((Number(m) % 12) + 12) % 12));
  return {
    ok: collisions.length === 0,
    collisions,
    collisionCount: collisions.length,
    musicalQualityClaim: false
  };
}

export function runMusicalBrainGates({
  source,
  candidate,
  sections,
  sourceArrangement,
  candidateArrangement,
  ownerRequestedReharmonization = false
} = {}) {
  const tonal = scoreAlternative(source || {}, candidate || {}, { ownerRequestedReharmonization });
  const continuity = sectionContinuity(sections || candidateArrangement?.sections || []);
  const context = arrangementContextPreservation(sourceArrangement || { sections }, candidateArrangement || { sections });
  const allowedPcs = pitchClasses(source?.melody || []);
  const scale = noObviousOutOfScaleCollisions(
    candidate?.melody || source?.melody || [],
    allowedPcs.length ? allowedPcs : HIJAZ_PITCH_CLASSES
  );
  const ok =
    tonal.ok &&
    tonal.tonalContextPreserved &&
    tonal.harmonicCompatibility &&
    continuity.ok &&
    context.ok &&
    scale.ok;
  return {
    ok,
    tonalContextPreservation: tonal.tonalContextPreserved,
    melodyChordCompatibility: tonal.melodyChordCompatibility,
    harmonicCompatibility: tonal.harmonicCompatibility,
    sectionContinuity: continuity.ok,
    styleChangeWithoutUnrequestedReharmonization: tonal.styleChangeWithoutUnrequestedReharmonization,
    arrangementContextPreservation: context.ok,
    noObviousOutOfScaleCollisions: scale.ok,
    details: { tonal, continuity, context, scale },
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false
  };
}
