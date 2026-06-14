import { useMemo, useState } from "react";
import {
  advanceOnboarding,
  createBetaChecklist,
  createDiagnosticsBundle,
  createFeedbackDraft,
  createKnownIssues,
  createPhase9State,
  createRecoverySnapshot,
  evaluateReleaseGateV2,
  resetOnboarding,
  validateDemoProject,
  validateFeedbackDraft,
  validateReleaseCandidate
} from "../beta/phase9Beta.js";
import { detectRuntimeFeatures } from "../core/diagnostics.js";
import { StatusBadge } from "./StatusBadge.jsx";

function Section({ title, eyebrow, children }) {
  return (
    <section className="betaSection" aria-labelledby={`beta-${title.toLowerCase().replaceAll(" ", "-")}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={`beta-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h2>
      {children}
    </section>
  );
}

export function PublicBetaPanel({ session, onSessionChange }) {
  const beta = session?.beta || createPhase9State();
  const [feedback, setFeedback] = useState(() => createFeedbackDraft({ description: "Local beta note", privacyConfirmed: true }));
  const releaseValidation = validateReleaseCandidate(beta.release);
  const demoValidation = validateDemoProject(beta.demoProject);
  const diagnostics = useMemo(() => createDiagnosticsBundle({
    browserCapabilities: detectRuntimeFeatures(),
    featureFlags: beta.flags.values,
    testGateStatus: "local-foundation",
    projectSchemaVersion: session?.version || 7,
    missingAssets: session?.sampler?.missingAssets || []
  }), [beta.flags.values, session]);
  const gate = evaluateReleaseGateV2({
    tests: true,
    staticCheck: true,
    build: true,
    runtimeCheck: true,
    desktopSmoke: true,
    routeSmoke: true,
    e2eWorkflows: true,
    accessibilityBaseline: true,
    performanceBudget: true,
    arabicEncoding: true,
    branding: true,
    pricing: true,
    accountOfflineFallback: true,
    stripeDisabled: true,
    cloudDisabled: true,
    updaterDisabled: true,
    installerPackageReadiness: true
  });
  const issues = createKnownIssues();
  const checklist = createBetaChecklist();
  const updateBeta = (nextBeta) => onSessionChange?.({ ...session, beta: nextBeta });
  const onboarding = beta.onboarding;
  const feedbackValidation = validateFeedbackDraft(feedback);

  return (
    <div className="betaPanel" dir={beta.localization.direction}>
      <header className="betaHeader">
        <div>
          <p className="eyebrow">Public Beta RC</p>
          <h1>UAOS Public Beta Control Center</h1>
          <p className="lead">Release candidate hardening, first-run onboarding, demo project, diagnostics, recovery, feedback and support foundations for local testing.</p>
        </div>
        <div className="betaLed" aria-label="Blue Live LED status">
          <span />
          <b>{gate.status}</b>
          <small>Production activation disabled</small>
        </div>
      </header>

      <div className="cards three">
        <article className="card">
          <StatusBadge status={releaseValidation.valid ? "available" : "planned"} />
          <h3>{beta.release.releaseId}</h3>
          <p>{beta.release.version} / {beta.release.channel}</p>
          <p>Signing: {beta.release.signingStatus}</p>
        </article>
        <article className="card">
          <StatusBadge status={demoValidation.valid ? "available" : "planned"} />
          <h3>Demo Project</h3>
          <p>{beta.demoProject.name}</p>
          <p>Synthetic only, no internet required.</p>
        </article>
        <article className="card">
          <StatusBadge status="not-included" />
          <h3>Production Services</h3>
          <p>Stripe, SMTP, remote sync, updater and cloud uploads are disabled.</p>
        </article>
      </div>

      <Section eyebrow="Onboarding" title="First Run Wizard">
        <div className="betaWizard" role="group" aria-label="Onboarding controls">
          <p>Current step: <b>{onboarding.currentStep}</b></p>
          <p>Language: {onboarding.locale.toUpperCase()} / account forced: {String(onboarding.accountRequired)} / microphone forced: {String(onboarding.microphoneRequired)}</p>
          <div className="buttonRow">
            <button onClick={() => updateBeta({ ...beta, onboarding: advanceOnboarding(onboarding) })}>Continue</button>
            <button className="secondary" onClick={() => updateBeta({ ...beta, onboarding: advanceOnboarding(onboarding, { skipOptional: true }) })}>Skip Optional</button>
            <button className="secondary" onClick={() => updateBeta({ ...beta, onboarding: resetOnboarding(onboarding.locale) })}>Reset</button>
          </div>
          <ol className="betaSteps">
            {onboarding.steps.map((step) => <li key={step} className={step === onboarding.currentStep ? "active" : ""}>{step}</li>)}
          </ol>
        </div>
      </Section>

      <Section eyebrow="Flags" title="Beta Feature Flags">
        <div className="cards three">
          {Object.entries(beta.flags.values).map(([key, value]) => (
            <article className="card compact" key={key}>
              <h3>{key}</h3>
              <p>{value ? "enabled" : "disabled"}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Demo" title="Synthetic Demo Project">
        <p>{beta.demoProject.arrangerSections.join(" -> ")}</p>
        <p>Tracks: {beta.demoProject.tracks.map((track) => track.type).join(", ")}</p>
        <p>AI result: {beta.demoProject.aiAnalysis.label}; remote model: {String(beta.demoProject.aiAnalysis.remoteModel)}</p>
        <button onClick={() => onSessionChange?.({ ...session, name: beta.demoProject.name, bpm: beta.demoProject.tempo, chord: beta.demoProject.chordProgression[0] })}>Load Demo Metadata</button>
      </Section>

      <Section eyebrow="Recovery" title="Crash Recovery">
        <p>Snapshots: {beta.recovery.snapshots.length} / dirty: {String(beta.recovery.dirty)} / raw audio stored: {String(beta.recovery.rawAudioStored)}</p>
        <button onClick={() => updateBeta({ ...beta, recovery: createRecoverySnapshot(beta.recovery, { sessionName: session?.name, bpm: session?.bpm }) })}>Create Recovery Snapshot</button>
      </Section>

      <Section eyebrow="Diagnostics" title="Diagnostics Bundle">
        <p>Private project content included: {String(diagnostics.privateProjectContentIncluded)} / raw audio included: {String(diagnostics.rawAudioIncluded)}</p>
        <textarea readOnly value={JSON.stringify(diagnostics, null, 2)} aria-label="Sanitized diagnostics JSON" />
      </Section>

      <Section eyebrow="Feedback" title="Local Feedback">
        <label>
          Description
          <textarea value={feedback.description} onChange={(event) => setFeedback(createFeedbackDraft({ ...feedback, description: event.target.value }))} />
        </label>
        <label className="checkboxLabel">
          <input type="checkbox" checked={feedback.privacyConfirmed} onChange={(event) => setFeedback(createFeedbackDraft({ ...feedback, privacyConfirmed: event.target.checked }))} />
          I understand feedback is saved locally and not uploaded.
        </label>
        <p>Remote submit: {feedback.remoteSubmit}; automatic upload: {String(feedback.automaticUpload)}</p>
        {!feedbackValidation.valid && <p className="errorText">{feedbackValidation.errors.join(" ")}</p>}
      </Section>

      <Section eyebrow="Support" title="Offline Support Center">
        <div className="cards three">
          {["Getting started", "Audio setup", "MIDI setup", "Hardware setup", "Sampler", "Arranger", "AI Studio", "DAW", "Account", "Cloud sync disabled", "Billing unavailable", "Diagnostics export", "Recovery", "Known issues", "Keyboard shortcuts"].map((item) => (
            <article className="card compact" key={item}><h3>{item}</h3><p>Offline help foundation.</p></article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Shortcuts" title="Keyboard Shortcuts">
        <div className="shortcutGrid">
          {Object.entries(beta.shortcuts).map(([action, key]) => <p key={action}><b>{action}</b><span>{key}</span></p>)}
        </div>
      </Section>

      <Section eyebrow="Quality" title="Known Issues And Checklist">
        <div className="cards two">
          <article className="card">
            <h3>Known Issues</h3>
            {issues.map((issue) => <p key={issue.id}>{issue.id}: {issue.title} ({issue.status})</p>)}
          </article>
          <article className="card">
            <h3>Beta Checklist</h3>
            {checklist.slice(0, 12).map((item) => <p key={item.name}>{item.name}: {item.status}</p>)}
          </article>
        </div>
      </Section>
    </div>
  );
}
