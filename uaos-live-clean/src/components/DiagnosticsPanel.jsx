import { detectRuntimeFeatures, runtimeStatus } from "../core/diagnostics.js";
import { FEATURE_FLAGS } from "../core/featureFlags.js";
import { useBackendStatus } from "../hooks/useBackendStatus.js";
import { StatusBadge } from "./StatusBadge.jsx";

export function DiagnosticsPanel() {
  const features = detectRuntimeFeatures();
  const status = runtimeStatus(features);
  const backend = useBackendStatus();
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
        <article className="card">
          <h3>Local Backend</h3>
          {backend.state === "loading" && <p>Checking http://127.0.0.1:5199...</p>}
          {backend.state === "offline" && <p className="errorText">{backend.error}</p>}
          {backend.state === "online" && (
            <>
              <p>{backend.status?.product} {backend.status?.version}</p>
              <p>{backend.status?.discoveredServices?.length || 0} discovered services</p>
              <ul>
                {(backend.status?.discoveredServices || []).map((service) => (
                  <li key={service.id}>
                    {service.name}: {service.status} {service.detail ? `- ${service.detail}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      </div>
      {!status.ok && <p className="errorText">{status.blocked.join(" ")}</p>}
    </section>
  );
}

