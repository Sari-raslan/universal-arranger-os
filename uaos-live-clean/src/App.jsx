import { useEffect, useMemo, useState } from "react";
import "./style.css";
import { ArrangerPanel } from "./components/ArrangerPanel.jsx";
import { AudioLab } from "./components/AudioLab.jsx";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { MidiMonitor } from "./components/MidiMonitor.jsx";
import { RuntimeStatus } from "./components/RuntimeStatus.jsx";
import { SessionsPanel } from "./components/SessionsPanel.jsx";
import { StatusBadge } from "./components/StatusBadge.jsx";
import { TimelinePanel } from "./components/TimelinePanel.jsx";
import { ProfessionalArrangerPanel } from "./components/ProfessionalArrangerPanel.jsx";
import { AILabsPanel } from "./components/AILabsPanel.jsx";
import { LaunchBanner, ImpressumPage, PrivacyPage, TermsPage, SupportPage, ContactPage } from "./components/LaunchPages.jsx";
import { HardwareIntegrationPanel } from "./components/HardwareIntegrationPanel.jsx";
import { DAWStudioPanel } from "./components/DAWStudioPanel.jsx";
import { CloudPlatformPanel } from "./components/CloudPlatformPanel.jsx";
import { PublicBetaPanel } from "./components/PublicBetaPanel.jsx";
import { PricingPage } from "./components/PricingPage.jsx";
import { canonicalPricing, createDownloadCenter } from "./commercial/phase10Commercial.js";
import { createAcademyManagerSummary } from "./social/academyBatch001.js";
import { createAcademyFullSummary } from "./social/academyFullProduction.js";
import { EVENT_TYPES } from "./core/eventTypes.js";
import { eventBus } from "./core/eventBus.js";
import { detectRuntimeFeatures } from "./core/diagnostics.js";
import { autosaveSession, createDefaultSession, loadSession } from "./session/sessionStore.js";

import { LibraryBrowser } from "./components/LibraryBrowser.jsx";
import { SamplerWorkbench } from "./components/SamplerWorkbench.jsx";
import { ArrangerEnginePanel } from "./components/ArrangerEnginePanel.jsx";
const plans = canonicalPricing().map((plan) => ({
  id: plan.productId,
  name: plan.name,
  price: plan.notForSale
    ? "49.99 EUR/month planned - not for sale"
    : plan.introAmount === 0
      ? "Free"
      : `${plan.introAmount.toFixed(2)} EUR/month for 3 paid months, then ${plan.regularAmount.toFixed(2)} EUR/month`,
  text: plan.productId === "sing"
    ? "Voice capture, basic local analysis, melody result, and local save with no forced account."
    : plan.productId === "studio"
      ? "DAW, sampler, recording, MIDI, local AI analysis, and project management."
      : plan.productId === "pro"
        ? "Arranger engine, hardware profiles, advanced MIDI, AI arrangement planning, and sampler/library integration."
        : "Future performer metadata only.",
  status: plan.status
}));

const routeItems = [
  { id: "home", label: "Home" },
  { id: "audio", label: "Audio Lab" },
  { id: "midi", label: "MIDI" },
  { id: "arranger", label: "Arranger" },
  { id: "timeline", label: "Timeline" },
  { id: "sessions", label: "Sessions" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "support", label: "Support" },
  { id: "privacy", label: "Privacy" },
  { id: "terms", label: "Terms" },
  { id: "contact", label: "Contact" },
  { id: "status", label: "Release Status" }
];

function route(page, setPage) {
  window.location.hash = "#/" + page;
  setPage(page);
}

function Nav({ page, setPage }) {
  const uniqueRouteItems = routeItems.filter(
    (item, index, items) =>
      items.findIndex(
        (candidate) =>
          candidate.id === item.id ||
          candidate.label.toLowerCase() === item.label.toLowerCase()
      ) === index
  );
  return (
    <nav className="nav">
      <div className="navControls">
        <button className="brandButton" onClick={() => route("home", setPage)}>
  <img onError={(event) => { event.currentTarget.style.display = "none"; }} src="/brand/uaos-icon-192.png" alt="" aria-hidden="true" />
  <span>UAOS</span>
</button>
        <button className="secondary" onClick={() => window.history.back()}>Back</button>
        <button className="secondary" onClick={() => route("home", setPage)}>Home</button>
      </div>
      <div className="navItems">
        {Array.from(new Map(routeItems.map((item) => [item.id, item])).values()).map((item) => (
          <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => route(item.id, setPage)}>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function TutorialHelpButton({ topic = "Batch 001", setPage }) {
  return (
    <div className="tutorialHelp">
      <button className="secondary" onClick={() => route("academy", setPage)}>Tutorial Help</button>
      <span>Tutorial prepared - publication pending. Opens local Academy preview.</span>
    </div>
  );
}

function Home({ setPage }) {
  return (
    <main className="page">
      <section className="hero uaosHero">
  <div className="uaosHeroBrand" aria-hidden="true">
    <img onError={(event) => { event.currentTarget.style.display = "none"; }} src="/brand/uaos-lockup-transparent.png" alt="" />
  </div>
        <p className="eyebrow">UAOS V1 • WINDOWS EARLY ACCESS</p>
        <h1>
  <span className="heroBrand">Universal Arranger</span>
  <span className="heroAccent">Operating System</span>
</h1>
        <p className="lead">Record audio, monitor MIDI, arrange ideas, manage sessions and work offline from one Windows music workstation.</p>
        <div className="heroActions">
  <button className="primaryLaunch" onClick={() => route("audio", setPage)}>Open Audio Lab</button>
  <button className="secondaryLaunch" onClick={() => route("midi", setPage)}>Open MIDI</button>
  <button className="secondaryLaunch" onClick={() => route("arranger", setPage)}>Open Arranger</button>
</div>
        <TutorialHelpButton topic="Home" setPage={setPage} />
      </section>
      <RuntimeStatus />
      <section className="cards">
        {plans.map((plan) => (
          <article className="card" key={plan.id}>
            <StatusBadge status={plan.status} />
            <h2>{plan.name}</h2>
            <p>{plan.text}</p>
            <b>{plan.price}</b>
          </article>
        ))}
      </section>
    </main>
  );
}

function Sing({ session, setSession }) {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">UAOS Sing <StatusBadge status="available" /></p>
        <h1>Voice to Music</h1>
        <p className="lead">Capture microphone input, estimate pitch and note names, record supported browser audio formats, and save the result as a UAOS session.</p>
        <TutorialHelpButton topic="Sing" setPage={(page) => route(page, () => {})} />
        <input value={session.name} onChange={(event) => setSession({ ...session, name: event.target.value })} />
        <AudioLab />
      </section>
    </main>
  );
}

function Studio({ session, setSession, setPage }) {
  return (
    <main className="page">
      <section className="panel">
        <TutorialHelpButton topic="Studio" setPage={setPage} />
        <DAWStudioPanel session={session} onSessionChange={setSession} />
      </section>
    </main>
  );
}

function AccountCloud({ session, setSession }) {
  return <main className="page"><section className="panel"><CloudPlatformPanel session={session} onSessionChange={setSession} /></section></main>;
}

function Pro({ session, setSession }) {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Pro Arranger <StatusBadge status="experimental" /></p>
        <h1>Keyboard Tools</h1>
        <p className="lead">Device profiles are MIDI mapping templates and runtime controls. Proprietary commercial style-file parsing is not claimed.</p>
        <TutorialHelpButton topic="Arranger" setPage={(page) => route(page, () => {})} />
        <ArrangerPanel session={session} onSessionChange={setSession} />
        <ProfessionalArrangerPanel />
        <ArrangerEnginePanel />
        <div className="cards">
          {["KORG Draft Profile", "Yamaha Draft Profile", "Roland Mapping Template", "Ketron Mapping Template"].map((name) => (
            <article className="card" key={name}>
              <StatusBadge status="planned" />
              <h2>{name}</h2>
              <p>Device-oriented MIDI mapping notes for future parser work.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Midi({ session, setSession }) {
  return <main className="page"><section className="panel"><TutorialHelpButton topic="MIDI" setPage={(page) => route(page, () => {})} /><MidiMonitor /><HardwareIntegrationPanel session={session} onSessionChange={setSession} /></section></main>;
}

function Hardware({ session, setSession }) {
  return <main className="page"><section className="panel"><TutorialHelpButton topic="Hardware" setPage={(page) => route(page, () => {})} /><HardwareIntegrationPanel session={session} onSessionChange={setSession} /></section></main>;
}

function Sounds() {
  return <main className="page"><section className="panel"><LibraryBrowser /></section></main>;
}

function Sampler({ setPage }) {
  return <main className="page"><section className="panel"><TutorialHelpButton topic="Sampler" setPage={setPage} /><SamplerWorkbench /></section></main>;
}

function Pricing() {
  return <><main className="page"><TutorialHelpButton topic="Pricing" setPage={(page) => route(page, () => {})} /></main><PricingPage /></>;
}

function Downloads({ setPage }) {
  const downloads = createDownloadCenter();
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Downloads <StatusBadge status="planned" /></p>
        <h1>Download Center</h1>
        <p className="lead">The web app is available locally. Desktop packaging is code-ready but unsigned; no fake signed installer links are shown.</p>
        <TutorialHelpButton topic="Downloads" setPage={setPage} />
        <div className="cards three">
          <article className="card"><h2>Windows</h2><p>{downloads.windowsInstaller.status}</p><p>Signed: {String(downloads.windowsInstaller.signed)}</p></article>
          <article className="card"><h2>Portable</h2><p>{downloads.portableBuild.status}</p><p>Checksum: pending</p></article>
          <article className="card"><h2>Mobile</h2><p>Android: {downloads.android.status}</p><p>iOS: {downloads.ios.status}</p></article>
        </div>
      </section>
    </main>
  );
}

function Demo({ session, setSession }) {
  return <main className="page"><section className="panel"><PublicBetaPanel session={session} onSessionChange={setSession} /></section></main>;
}

function Support({ setPage }) {
  const topics = ["Installation", "First run", "Account", "Offline mode", "Audio", "Microphone", "MIDI", "KORG PA3X", "KORG PA5X", "Yamaha Genos", "Roland BK-9", "Ketron SD9", "Sampler", "Arranger", "AI Studio", "DAW", "Billing unavailable", "Founder pricing", "Diagnostics", "Crash recovery", "Uninstall", "Privacy", "Known issues", "Feedback export"];
  return <main className="page"><section className="panel"><p className="eyebrow">Support</p><h1>Offline Support Center</h1><TutorialHelpButton topic="Support" setPage={setPage} /><div className="cards three">{topics.map((topic) => <article className="card" key={topic}><h2>{topic}</h2><p>Local support foundation. No network required.</p><p>Tutorial prepared - publication pending.</p></article>)}</div></section></main>;
}

function AcademyManager() {
  const academy = createAcademyManagerSummary();
  const full = createAcademyFullSummary();
  const first = academy.lessons[0];
  return (
    <main className="page">
      <section className="panel academyManager">
        <p className="eyebrow">UAOS Academy & Social Hub</p>
        <h1>Batch 001</h1>
        <p className="lead">Local review dashboard for all UAOS Academy tutorials. Public Publish is disabled; OAuth is not configured; all platform packages are local drafts.</p>
        <div className="academyTabs" aria-label="Academy sections">
          {full.tabs.map((tabName) => <span key={tabName}>{tabName}</span>)}
        </div>
        <div className="academyMetrics">
          <div><strong>{full.totalFeatures}</strong><span>Total features</span></div>
          <div><strong>{full.totalTutorials}</strong><span>Total tutorials</span></div>
          <div><strong>{full.coveredFeatures}</strong><span>Covered features</span></div>
          <div><strong>{full.missingTutorials}</strong><span>Missing tutorials</span></div>
          <div><strong>{full.scriptsReady}</strong><span>Scripts ready</span></div>
          <div><strong>{full.rendersReady}</strong><span>Renders ready</span></div>
          <div><strong>{full.blockedFfmpeg}</strong><span>Blocked FFmpeg</span></div>
          <div><strong>{full.blockedNarration}</strong><span>Blocked narration</span></div>
          <div><strong>{full.narrationAssetsApproved}/{full.narrationAssetsExpected}</strong><span>Narration approved</span></div>
          <div><strong>{full.blockedOAuth}</strong><span>Blocked OAuth</span></div>
          <div><strong>{full.approvalReadyItems}/{full.publicationQueueItems}</strong><span>Owner approved</span></div>
          <div><strong>{full.reviewEvidenceBlockers}</strong><span>Evidence blockers</span></div>
          <div><strong>{full.evidenceTemplateStatus}</strong><span>Evidence template</span></div>
          <div><strong>{full.evidenceWorkingStatus}</strong><span>Reviewer file</span></div>
          <div><strong>{full.evidenceAuditStatus}</strong><span>Evidence audit</span></div>
          <div><strong>{full.evidenceAuditBlockers}</strong><span>Audit blockers</span></div>
            <div><strong>{full.evidenceArtifactIssues}</strong><span>Artifact issues</span></div>
            <div><strong>{full.evidenceFreshnessIssues}</strong><span>Freshness issues</span></div>
            <div><strong>{full.evidenceProvenanceIssues}</strong><span>Provenance issues</span></div>
            <div><strong>{full.evidenceConsistencyIssues}</strong><span>Evidence consistency</span></div>
          <div><strong>{full.draftQueueItems}</strong><span>Draft queue</span></div>
          <div><strong>{full.waitingReview}</strong><span>Waiting review</span></div>
          <div><strong>{full.readyPrivateUpload}</strong><span>Ready private</span></div>
          <div><strong>{full.published}</strong><span>Published</span></div>
        </div>
        <div className="buttonRow">
          <button>Preview Video</button>
          <button className="secondary">Preview Caption</button>
          <button className="secondary">Preview Thumbnail</button>
          <button className="secondary">Preview Platform Post</button>
          <button disabled>Approve for Private Upload</button>
          <button disabled>Approve for Unlisted Upload</button>
          <button disabled>Public Publish disabled</button>
        </div>
        <div className="academyPreview">
          <div>
            <h2>{first.titleAr}</h2>
            <p>{first.preview}</p>
          </div>
          <div>
            <strong>OAuth</strong>
            <span>{first.oauthStatus}</span>
          </div>
          <div>
            <strong>Publish</strong>
            <span>{first.publishStatus}</span>
          </div>
          <div>
            <strong>Evidence gate</strong>
            <span>{full.reviewEvidenceStatus}</span>
          </div>
            <div>
              <strong>Evidence template</strong>
              <span>{full.evidenceTemplateStatus}</span>
            </div>
            <div>
              <strong>Reviewer working file</strong>
              <span>{full.evidenceWorkingStatus}</span>
            </div>
            <div>
              <strong>Evidence audit</strong>
              <span>{full.evidenceAuditStatus}</span>
            </div>
          </div>
        <div className="cards two">
          {academy.lessons.map((lesson) => (
            <article className="card" key={lesson.lessonId}>
              <h2>{lesson.lessonId}: {lesson.titleAr}</h2>
              <p>Route: {lesson.route}</p>
              <p>Platforms: {lesson.platforms.length}</p>
              <p>Render: {lesson.renderStatus}</p>
              <p>Captions: {lesson.captionsStatus}</p>
              <p>Thumbnails: {lesson.thumbnailsStatus}</p>
              <p>Review: {lesson.reviewStatus}</p>
              <p>Upload: {lesson.uploadStatus}</p>
              <p>Publish: {lesson.publishStatus}</p>
              <p>Files: {lesson.localFilePaths.scripts}</p>
              <p>Missing: {lesson.missingRequirements.join(", ")}</p>
            </article>
          ))}
        </div>
        <section className="panelSection">
          <h2>OAuth Readiness</h2>
          <div className="cards three">
            {academy.oauthReadiness.map((item) => (
              <article className="card" key={item.platform}>
                <h3>{item.platform}</h3>
                <p>Configured: {String(item.configured)}</p>
                <p>OAuth required: {String(item.oauthRequired)}</p>
                <p>Token storage: {item.tokenStorage}</p>
                <p>Publish disabled: {String(item.publishDisabled)}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="panelSection">
          <h2>Internal Preview</h2>
          <div className="academyPreview">
            <div><strong>Long Video Preview</strong><span>{String(full.preview.longVideoPreview)}</span></div>
            <div><strong>Captions</strong><span>{full.preview.language.join(", ")}</span></div>
            <div><strong>Warnings</strong><span>{full.preview.warnings.join(", ")}</span></div>
          </div>
        </section>
      </section>
    </main>
  );
}

function LegalSummary({ type }) {
  return <main className="page"><section className="panel"><p className="eyebrow">LEGAL REVIEW REQUIRED</p><h1>{type === "privacy" ? "Privacy Summary" : "Terms Summary"}</h1><p className="lead">This is a commercial release foundation summary, not final legal approval. No registered company, VAT ID, or legal address is invented here.</p><div className="cards two"><article className="card"><h2>Local-first defaults</h2><p>Cloud sync, telemetry, updater, billing, and feedback upload remain disabled until explicitly configured.</p></article><article className="card"><h2>User rights foundation</h2><p>Data export, account deletion, refund policy, subscription terms, AI disclaimer, hardware disclaimer, copyright notice, and commercial library notice require legal review.</p></article></div></section></main>;
}

function Contact() {
  return <main className="page"><section className="panel"><p className="eyebrow">Contact foundation</p><h1>Contact</h1><p className="lead">Support contact and legal entity metadata are placeholders pending external approval. No production contact form or data submission is enabled.</p></section></main>;
}

function ReleaseStatus({ setPage }) {
  const features = detectRuntimeFeatures();
  const rows = [
    ["Browser secure context", features.secureContext ? "available" : "planned"],
    ["MediaDevices", features.microphone ? "available" : "planned"],
    ["Web Audio", features.audioContext ? "available" : "planned"],
    ["MediaRecorder", features.mediaRecorder ? "available" : "planned"],
    ["Web MIDI", features.webMidi ? "experimental" : "planned"],
    ["Local storage", features.localStorage ? "available" : "planned"],
    ["Electron bridge", features.electronBridge ? "experimental" : "planned"],
    ["Commercial style parsing", "not-included"],
    ["Cloud AI models", "not-included"]
  ];
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Release Status</p>
        <h1>Runtime Capabilities</h1>
        <p className="lead">The status page reports what the browser and desktop bridge can actually provide. Hardware-only checks remain manual until a MIDI controller or microphone is connected.</p>
        <TutorialHelpButton topic="Diagnostics" setPage={setPage} />
        <div className="cards three">
          {rows.map(([name, status]) => (
            <article className="card" key={name}>
              <StatusBadge status={status} />
              <h2>{name}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function AppShell() {
  const [page, setPage] = useState(window.location.hash.replace("#/", "") || "home");
  const [session, setSession] = useState(() => {
    try {
      return loadSession();
    } catch {
      return createDefaultSession();
    }
  });

  useEffect(() => {
    const onHash = () => setPage(window.location.hash.replace("#/", "") || "home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    autosaveSession(session);
  }, [session]);

  const screen = useMemo(() => {
    if (page === "sing") return <Sing session={session} setSession={setSession} />;
    if (page === "studio") return <Studio session={session} setSession={setSession} setPage={setPage} />;
    if (page === "account") return <AccountCloud session={session} setSession={setSession} />;
    if (page === "pro") return <Pro session={session} setSession={setSession} />;
    if (page === "midi") return <Midi session={session} setSession={setSession} />;
    if (page === "hardware") return <Hardware session={session} setSession={setSession} />;
    if (page === "sounds") return <Sounds />;
    if (page === "sampler") return <Sampler setPage={setPage} />;
    if (page === "pricing") return <Pricing />;
    if (page === "downloads") return <Downloads setPage={setPage} />;
    if (page === "support") return <Support setPage={setPage} />;
    if (page === "academy") return <AcademyManager />;
    if (page === "demo") return <Demo session={session} setSession={setSession} />;
    if (page === "privacy") return <LegalSummary type="privacy" />;
    if (page === "terms") return <LegalSummary type="terms" />;
    if (page === "contact") return <Contact />;
    if (page === "status") return <ReleaseStatus setPage={setPage} />;
    if (page === "audio") return <main className="page"><section className="panel"><AudioLab /></section></main>;
    if (page === "timeline") return <main className="page"><section className="panel"><TimelinePanel session={session} onSessionChange={setSession} /></section></main>;
    if (page === "arranger") return <main className="page"><section className="panel"><ArrangerPanel session={session} onSessionChange={setSession} /></section></main>;
    if (page === "live") return <main className="page"><section className="panel"><ArrangerPanel session={session} onSessionChange={setSession} live /><MidiMonitor compact /></section></main>;
    if (page === "sessions") return <main className="page"><section className="panel"><SessionsPanel session={session} onSessionChange={setSession} /></section></main>;
    if (page === "diagnostics") return <main className="page"><section className="panel"><TutorialHelpButton topic="Diagnostics" setPage={setPage} /><DiagnosticsPanel /></section></main>;
    if (page === "ai") return <main className="page"><section className="panel"><TutorialHelpButton topic="AI" setPage={setPage} /><AILabsPanel /></section></main>;
    return <Home setPage={setPage} />;
  }, [page, session]);

  return (
    <>
      <Nav page={page} setPage={setPage} />
      <section className="uaosReleaseStrip">
        <div>
          <strong>UAOS Windows Early Access V1</strong>
          <span>Local audio, MIDI, arranger and session tools</span>
        </div>

        <div className="uaosReleaseStripStatus">
          <span>Web: Live</span>
          <span>Sales: Pending final checkout setup</span>
          <span>Build: Windows Early Access</span>
        </div>
      </section>
      {screen}
      <footer className="uaosFinalFooter">
  <strong>UAOS Windows Early Access V1</strong>
  <span>V1_SCOPE_FROZEN_FOR_FINAL_QA</span>
  <span>Final checkout, installer delivery and legal review are the remaining launch gates.</span>
</footer>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary onError={(error) => eventBus.emit(EVENT_TYPES.RUNTIME_ERROR, { message: error.message })}>
      <AppShell />
    </ErrorBoundary>
  );
}





