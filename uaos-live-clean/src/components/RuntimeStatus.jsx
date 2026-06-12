import { detectRuntimeFeatures, runtimeStatus } from "../core/diagnostics.js";

export function RuntimeStatus() {
  const features = detectRuntimeFeatures();
  const status = runtimeStatus(features);
  return (
    <section className="runtime">
      <b>Runtime</b>
      <span>{status.ok ? "Ready with available browser capabilities" : "Limited browser support"}</span>
      <div className="runtimeGrid">
        {Object.entries(features).map(([key, value]) => (
          <span key={key} className={value ? "ok" : "warn"}>{key}: {value ? "yes" : "no"}</span>
        ))}
      </div>
      {!status.ok && <p>{status.blocked.join(" ")}</p>}
    </section>
  );
}

