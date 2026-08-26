/**
 * Library Factory articulation engine. Metadata/rules only. No sampled audio copy.
 */
export function loadArticulationEngine(doc) {
  if (!doc || doc.engine !== "UAOS Articulation Engine") {
    throw new Error("Not a UAOS articulation engine document.");
  }
  if (!Array.isArray(doc.rules) || doc.rules.length < 1) {
    throw new Error("Articulation engine has no rules.");
  }
  const names = new Set();
  for (const rule of doc.rules) {
    if (!rule.name || !rule.trigger) throw new Error("Rule missing name/trigger.");
    if (names.has(rule.name)) throw new Error(`Duplicate articulation: ${rule.name}`);
    names.add(rule.name);
  }
  return {
    version: doc.version,
    rules: doc.rules,
    resolve(event) {
      if (event?.overlap) return "legato";
      if (Number(event?.velocity) > 105) return "slide";
      if (event?.grace) return "ornament";
      if (event?.keyswitch === "C0") return "tremolo";
      if (event?.keyswitch === "D0") return "fall";
      if (event?.keyswitch === "E0") return "scoop";
      return "none";
    }
  };
}
