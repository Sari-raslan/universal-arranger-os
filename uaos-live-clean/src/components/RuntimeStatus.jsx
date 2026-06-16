import { detectRuntimeFeatures, runtimeStatus } from "../core/diagnostics.js";
import { useBackendStatus } from "../hooks/useBackendStatus.js";

export function RuntimeStatus() {
  const features = detectRuntimeFeatures();
  const status = runtimeStatus(features);
  const backend = useBackendStatus();
  return (
    <section className="runtime">
      <b>Runtime</b>
      <span>{status.ok ? "Ready with available browser capabilities" : "Limited browser support"}</span>
      <div className="runtimeGrid">
        {Object.entries(features).map(([key, value]) => (
          <span key={key} className={value ? "ok" : "warn"}>{key}: {value ? "yes" : "no"}</span>
        ))}
      </div>
      <div className="runtimeBackend">
        <b>Local backend</b>
        {backend.state === "loading" ? (
          <span>Checking `http://127.0.0.1:5199`...</span>
        ) : backend.state === "online" ? (
          <>
            <span>Online</span>
            <small>{backend.status?.product} {backend.status?.version}</small>
            <small>{backend.status?.discoveredServices?.length || 0} discovered services</small>
          </>
        ) : (
          <>
            <span>Offline or unavailable</span>
            <small>{backend.error}</small>
          </>
        )}
      </div>
      {!status.ok && <p>{status.blocked.join(" ")}</p>}
    </section>
  );
}

