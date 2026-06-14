import { useEffect, useMemo, useState } from "react";
import { cloudProjectFromDaw, migrateCloudState } from "../cloud/cloudPhase8.js";

const API_BASE = "http://127.0.0.1:3041";

const fallbackPlans = [
  { id: "free", name: "Free / Sing", text: "EUR 0", checkoutAvailable: false },
  { id: "studio-founders", name: "Studio Founders", text: "EUR 7.99 for first 3 paid months, then EUR 12.99", checkoutAvailable: false },
  { id: "pro-arranger-founders", name: "Pro Arranger Founders", text: "EUR 19.99 for first 3 paid months, then EUR 29.99", checkoutAvailable: false },
  { id: "ultimate-planned", name: "Ultimate / Performer", text: "EUR 49.99 planned / not for sale", checkoutAvailable: false },
];

async function safeJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  return response.json();
}

export function CloudPlatformPanel({ session, onSessionChange }) {
  const cloud = useMemo(() => migrateCloudState(session?.cloud), [session?.cloud]);
  const [system, setSystem] = useState({ health: "unknown", ready: "unknown", capabilities: null });
  const [plans, setPlans] = useState(fallbackPlans);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState("disabled");
  const localProject = cloudProjectFromDaw(session?.dawProject, cloud);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([safeJson("/health"), safeJson("/ready"), safeJson("/capabilities"), safeJson("/billing/plans")]).then((results) => {
      if (cancelled) return;
      const [health, ready, capabilities, billing] = results.map((item) => item.status === "fulfilled" ? item.value : null);
      setSystem({
        health: health?.ok ? "online" : "offline",
        ready: ready?.ready ? "ready" : "not-ready",
        capabilities: capabilities?.capabilities || null,
      });
      if (billing?.plans) setPlans(billing.plans);
    }).catch(() => setSystem((current) => ({ ...current, health: "offline", ready: "not-ready" })));
    return () => { cancelled = true; };
  }, []);

  function updateCloud(changes) {
    const next = migrateCloudState({ ...cloud, ...changes });
    onSessionChange?.({ ...session, cloud: next });
  }

  function requestSync() {
    updateCloud({ sync: { ...cloud.sync, status: cloud.sync.enabled ? "queued" : "disabled", pendingUpload: cloud.sync.enabled, rawAudioUpload: false } });
    setMessage(cloud.sync.enabled ? "Metadata sync queued. Raw audio upload remains disabled." : "Cloud sync is disabled by default.");
  }

  function resolveConflict(action) {
    setConflict(action);
    updateCloud({ sync: { ...cloud.sync, conflictState: action, status: action === "duplicate-project" ? "queued" : "manual-resolution" } });
  }

  return (
    <section className="cloudPanel">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">UAOS Cloud Platform</p>
          <h1>Account, Sync, Billing</h1>
          <p className="lead">Offline-first cloud foundation. PostgreSQL, Stripe, SMTP, and remote sync stay disabled until explicitly configured.</p>
        </div>
        <span className="statusBadge experimental">{system.health}</span>
      </div>

      <div className="hardwareLedStrip" aria-label="Cloud status LEDs">
        {[system.health === "online", system.ready === "ready", cloud.sync.enabled, cloud.privacy.cloudSync, false, false].map((on, index) => <span key={index} className={on ? "on" : ""} />)}
      </div>

      <div className="cards three">
        <article className="card">
          <h2>System</h2>
          <p>Health: {system.health}</p>
          <p>Readiness: {system.ready}</p>
          <p>Database: {system.capabilities?.database || "disabled-local-memory"}</p>
          <p>Email: {system.capabilities?.email || "memory-provider"}</p>
          <p>Billing: {system.capabilities?.billing || "disabled-provider"}</p>
        </article>

        <article className="card">
          <h2>Account</h2>
          <p>Use the UAOS account button for registration, login, verification, password reset, and logout.</p>
          <p>Session cookies are HttpOnly-capable on the backend; production Secure cookies require production configuration.</p>
          <p>Admin permissions are never granted automatically.</p>
        </article>

        <article className="card">
          <h2>Privacy</h2>
          <label><input type="checkbox" checked={cloud.privacy.analytics} onChange={(event) => updateCloud({ privacy: { ...cloud.privacy, analytics: event.target.checked } })} /> Analytics consent</label>
          <label><input type="checkbox" checked={cloud.privacy.cloudSync} onChange={(event) => updateCloud({ privacy: { ...cloud.privacy, cloudSync: event.target.checked } })} /> Cloud sync consent</label>
          <label><input type="checkbox" checked={cloud.privacy.aiRemoteProvider} onChange={(event) => updateCloud({ privacy: { ...cloud.privacy, aiRemoteProvider: event.target.checked } })} /> Remote AI consent</label>
          <p>No advertiser sharing. No raw audio upload by default.</p>
        </article>
      </div>

      <section className="panelSection">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Cloud Projects</p>
            <h2>Metadata sync contract</h2>
          </div>
          <div className="controlRow">
            <button onClick={requestSync}>Retry</button>
            <button className="secondary" onClick={() => updateCloud({ sync: { ...cloud.sync, status: "cancelled" } })}>Cancel</button>
            <button className="secondary" onClick={() => resolveConflict("keep-local")}>Keep Local</button>
            <button className="secondary" onClick={() => resolveConflict("keep-remote")}>Keep Remote</button>
            <button className="secondary" onClick={() => resolveConflict("duplicate-project")}>Duplicate</button>
          </div>
        </div>
        <div className="cards two">
          <article className="card">
            <h3>{localProject.name}</h3>
            <p>Sync: {localProject.syncStatus}</p>
            <p>Local revision: {localProject.localRevision}</p>
            <p>Remote revision: {localProject.remoteRevision}</p>
            <p>Conflict: {conflict || localProject.conflictState}</p>
            <p>Raw audio upload: disabled</p>
          </article>
          <article className="card">
            <h3>Versioning</h3>
            <p>Manual save, autosave, and recovery version metadata are supported by the backend contract.</p>
            <p>Restore version is a metadata contract. Audio buffers are never stored in JSON records.</p>
          </article>
        </div>
      </section>

      <section className="panelSection">
        <p className="eyebrow">Billing</p>
        <div className="cards">
          {plans.map((plan) => (
            <article className="card" key={plan.id}>
              <span className="statusBadge planned">{plan.checkoutAvailable ? "available" : "checkout disabled"}</span>
              <h2>{plan.name}</h2>
              <p>{plan.text || `${plan.currency || "EUR"} ${plan.price ?? plan.introPrice ?? plan.plannedPrice ?? 0}`}</p>
              <p>{plan.introMonths ? `${plan.introMonths} paid founders months, then regular price.` : plan.notForSale ? "Planned / not for sale." : "No hidden charge."}</p>
              <button disabled>{plan.notForSale ? "Not for sale" : "Provider unavailable"}</button>
            </article>
          ))}
        </div>
      </section>

      <section className="panelSection">
        <p className="eyebrow">Offline First</p>
        <p>Arranger, Sampler, local AI provider, Hardware, DAW, local session, local recording, and local MIDI export continue when Accounts API, database, Stripe, SMTP, cloud sync, or internet are unavailable.</p>
        {message ? <p className="libraryMessage">{message}</p> : null}
      </section>
    </section>
  );
}
