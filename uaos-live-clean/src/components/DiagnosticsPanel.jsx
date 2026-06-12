import { detectRuntimeFeatures, runtimeStatus } from "../core/diagnostics.js";
import { FEATURE_FLAGS } from "../core/featureFlags.js";
import { StatusBadge } from "./StatusBadge.jsx";

export function DiagnosticsPanel() {
  const features = detectRuntimeFeatures();
  const status = runtimeStatus(features);
  return (
    <section className="panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Diagnostics</p>
          <h2>{status.ok ? "Runtime checks passed" : "Runtime limitations detected"}</h2>
        </div>
      </div>
      <div className="cards two">
        <article className="card">
          <h3>Browser Capabilities</h3>
          {Object.entries(features).map(([key, value]) => <p key={key}>{key}: {value ? "available" : "unsupported"}</p>)}
        </article>
        <article className="card">
          <h3>Feature Matrix</h3>
          {Object.entries(FEATURE_FLAGS).map(([key, value]) => <p key={key}>{key} <StatusBadge status={value} /></p>)}
        </article>
      </div>
      {!status.ok && <p className="errorText">{status.blocked.join(" ")}</p>}
    </section>
  );
}

