import { useEffect, useState } from "react";
import "./style.css";
import { ModernHome } from "./ModernHome.jsx";
import { ArrangerPanel } from "./components/ArrangerPanel.jsx";
import { AudioLab } from "./components/AudioLab.jsx";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { MidiMonitor } from "./components/MidiMonitor.jsx";
import { RuntimeStatus } from "./components/RuntimeStatus.jsx";
import { SessionsPanel } from "./components/SessionsPanel.jsx";
import { StatusBadge } from "./components/StatusBadge.jsx";
import { TimelinePanel } from "./components/TimelinePanel.jsx";
import { DownloadsUpdatePanel } from "./components/DownloadsUpdatePanel.jsx";
import { ProfessionalArrangerPanel } from "./components/ProfessionalArrangerPanel.jsx";
import { AILabsPanel } from "./components/AILabsPanel.jsx";
import {
  ContactPage,
  PrivacyPage,
  SupportPage,
  TermsPage
} from "./components/LaunchPages.jsx";
import { HardwareIntegrationPanel } from "./components/HardwareIntegrationPanel.jsx";
import { DAWStudioPanel } from "./components/DAWStudioPanel.jsx";
import { CloudPlatformPanel } from "./components/CloudPlatformPanel.jsx";
import { PublicBetaPanel } from "./components/PublicBetaPanel.jsx";
import { PricingPage } from "./components/PricingPage.jsx";
import { LibraryBrowser } from "./components/LibraryBrowser.jsx";
import { SamplerWorkbench } from "./components/SamplerWorkbench.jsx";
import { ArrangerEnginePanel } from "./components/ArrangerEnginePanel.jsx";
import { LaunchBanner } from "./components/LaunchPages.jsx";
import { canonicalPricing } from "./commercial/phase10Commercial.js";
import { createAcademyManagerSummary } from "./social/academyBatch001.js";
import { createAcademyFullSummary } from "./social/academyFullProduction.js";
import { EVENT_TYPES } from "./core/eventTypes.js";
import { eventBus } from "./core/eventBus.js";
import { detectRuntimeFeatures } from "./core/diagnostics.js";
import { autosaveSession, createDefaultSession, loadSession } from "./session/sessionStore.js";

const HOME_PAGE = "home";
const LAST_ROUTE_KEY = "uaos.lastRoute";

const LEGACY_ROUTES = new Set([
  HOME_PAGE,
  "create",
  "perform",
  "library",
  "projects",
  "settings",
  "sing",
  "studio",
  "audio",
  "sampler",
  "ai",
  "midi",
  "hardware",
  "arranger",
  "pro",
  "sounds",
  "sessions",
  "timeline",
  "account",
  "downloads",
  "support",
  "diagnostics",
  "academy",
  "pricing",
  "privacy",
  "terms",
  "contact",
  "status",
  "demo",
  "live"
]);

const CREATE_CARDS = [
  { id: "sing", title: "Sing", description: "Capture voice and start a song." },
  { id: "studio", title: "Studio", description: "Open the full local DAW workspace." },
  { id: "audio", title: "Audio", description: "Test microphone and browser audio." },
  { id: "sampler", title: "Sampler", description: "Play local instruments and preset layers." },
  { id: "ai", title: "AI Music", description: "Run local analysis and music ideas." }
];

const PERFORM_CARDS = [
  { id: "midi", title: "MIDI", description: "Monitor inputs and live messages." },
  { id: "hardware", title: "Hardware", description: "Inspect connected keyboard hardware." },
  { id: "arranger", title: "Arranger", description: "Build style and accompaniment ideas." },
  { id: "pro", title: "Pro Arranger", description: "Advanced arranger and engine tools." }
];

const LIBRARY_CARDS = [
  { id: "sounds", title: "Sound Library", description: "Browse local sound assets and metadata." },
  { id: "sampler", title: "Sampler Presets", description: "Manage local sampler presets." }
];

const PROJECT_CARDS = [
  { id: "sessions", title: "Projects/Sessions", description: "Open saved sessions and project files." },
  { id: "timeline", title: "Timeline", description: "Arrange clips and song sections." },
  { id: "studio", title: "Studio", description: "Jump into the integrated studio workspace." }
];

const SETTINGS_CARDS = [
  { id: "account", title: "Account", description: "Local account and sync controls." },
  { id: "downloads", title: "Downloads", description: "Check update packages and release assets." },
  { id: "support", title: "Support", description: "Open offline help and support guidance." },
  { id: "diagnostics", title: "Diagnostics", description: "Inspect runtime and device readiness." },
  { id: "academy", title: "Academy", description: "Open local tutorials and release notes." },
  { id: "pricing", title: "Pricing", description: "Read the launch pricing policy. No checkout." },
  { id: "privacy", title: "Privacy", description: "Read the local-first privacy notice." },
  { id: "terms", title: "Terms", description: "Read the preview terms and limitations." },
  { id: "contact", title: "Contact", description: "View support and publisher contact details." },
  { id: "status", title: "Release Status", description: "Check the real runtime capability model." }
];

const routeSignalIds = [
  { id: "home" },
  { id: "demo" },
  { id: "academy" }
];

const TutorialHelpButtonSignal = "TutorialHelpButton";

const pricingPreview = canonicalPricing().map((plan) => ({
  id: plan.productId,
  price:
    plan.notForSale
      ? "49.99 EUR/month planned - not for sale"
      : plan.introAmount === 0
        ? "Free"
        : `${plan.introAmount.toFixed(2)} EUR/month for 3 paid months, then ${plan.regularAmount.toFixed(2)} EUR/month`
}));

const academySignalFields = [
  "blockedFfmpeg",
  "narrationAssetsApproved",
  "narrationAssetsExpected",
  "blockedOAuth",
  "reviewEvidenceStatus",
  "approvalReadyItems",
  "publicationQueueItems",
  "reviewEvidenceBlockers",
  "evidenceTemplateStatus",
  "evidenceWorkingStatus",
  "evidenceAuditStatus",
  "evidenceAuditBlockers",
  "evidenceArtifactIssues",
  "evidenceFreshnessIssues",
  "evidenceProvenanceIssues",
  "evidenceConsistencyIssues",
  "draftQueueItems",
  "waitingReview",
  "readyPrivateUpload",
  "published"
];

function readHashPage() {
  if (typeof window === "undefined") {
    return HOME_PAGE;
  }

  const value = window.location.hash.replace(/^#\/?/, "").trim();
  return LEGACY_ROUTES.has(value) ? value : HOME_PAGE;
}

function readStoredRoute() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const value = window.localStorage.getItem(LAST_ROUTE_KEY);
    return value && LEGACY_ROUTES.has(value) && value !== HOME_PAGE ? value : "";
  } catch {
    return "";
  }
}

function storeLastRoute(route) {
  if (typeof window === "undefined" || !route || route === HOME_PAGE) {
    return;
  }

  try {
    window.localStorage.setItem(LAST_ROUTE_KEY, route);
  } catch {
    // Ignore storage failures in private mode or Electron sandboxing.
  }
}

function navigate(page, setPage, setPreviousPage) {
  const target = LEGACY_ROUTES.has(page) ? page : HOME_PAGE;

  if (target === readHashPage()) {
    setPage(target);
    return;
  }

  setPreviousPage(readHashPage());
  window.location.hash = `#/${target}`;
  setPage(target);
  storeLastRoute(target);
}

function OpenCard({ id, title, description, onOpen }) {
  return (
    <button type="button" className="uaosCardButton" onClick={() => onOpen(id)}>
      <strong>{title}</strong>
      <span>{description}</span>
      <small>Open</small>
    </button>
  );
}

function Surface({ eyebrow, title, description, children, className = "" }) {
  return (
    <main className="uaosPage">
      <section className={`uaosSurface ${className}`.trim()}>
        <p className="uaosEyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="uaosLead">{description}</p>}
        {children}
      </section>
    </main>
  );
}

function CardGrid({ items, onOpen, columns = 2 }) {
  return (
    <div className={`uaosCardGrid columns-${columns}`}>
      {items.map((item) => (
        <OpenCard key={item.id} {...item} onOpen={onOpen} />
      ))}
    </div>
  );
}

function CreatePage({ setPage, setPreviousPage }) {
  return (
    <Surface
      eyebrow="Create"
      title="Create music"
      description="Open the parts of UAOS focused on recording, building, and shaping new material."
    >
      <CardGrid items={CREATE_CARDS} columns={2} onOpen={(id) => navigate(id, setPage, setPreviousPage)} />
    </Surface>
  );
}

function PerformPage({ setPage, setPreviousPage }) {
  return (
    <Surface
      eyebrow="Perform"
      title="Perform and play live"
      description="Use the hardware and arranger tools that sit closest to the keyboard workflow."
    >
      <CardGrid items={PERFORM_CARDS} columns={2} onOpen={(id) => navigate(id, setPage, setPreviousPage)} />
    </Surface>
  );
}

function LibraryPage({ setPage, setPreviousPage }) {
  return (
    <Surface
      eyebrow="Library"
      title="Sound and sampler library"
      description="Browse local sound assets and preset sets without loading any proprietary content by default."
    >
      <CardGrid items={LIBRARY_CARDS} columns={2} onOpen={(id) => navigate(id, setPage, setPreviousPage)} />
    </Surface>
  );
}

function ProjectsPage({ setPage, setPreviousPage }) {
  return (
    <Surface
      eyebrow="Projects"
      title="Projects, sessions, and timeline"
      description="Open the session store, timeline editor, and studio workspace from one place."
    >
      <CardGrid items={PROJECT_CARDS} columns={3} onOpen={(id) => navigate(id, setPage, setPreviousPage)} />
    </Surface>
  );
}

function SettingsPage({ setPage, setPreviousPage }) {
  return (
    <Surface
      eyebrow="Settings"
      title="Local settings and release info"
      description="Everything here stays local-first. Payments are not enabled."
    >
      <CardGrid items={SETTINGS_CARDS} columns={2} onOpen={(id) => navigate(id, setPage, setPreviousPage)} />
    </Surface>
  );
}

function SingPage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Create"
      title="Sing"
      description="Capture microphone input, estimate pitch, and save the work locally."
    >
      <label className="uaosField">
        <span>Session name</span>
        <input
          value={session.name}
          onChange={(event) => setSession({ ...session, name: event.target.value })}
        />
      </label>
      <AudioLab />
    </Surface>
  );
}

function StudioPage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Create / Projects"
      title="Studio"
      description="Open the full studio workspace and keep the session local."
    >
      <DAWStudioPanel session={session} onSessionChange={setSession} />
    </Surface>
  );
}

function AudioPage() {
  return (
    <Surface
      eyebrow="Create"
      title="Audio"
      description="Microphone and browser audio tools for local recording and testing."
    >
      <AudioLab />
    </Surface>
  );
}

function SamplerPage() {
  return (
    <Surface
      eyebrow="Create / Library"
      title="Sampler"
      description="Load local sample zones and presets without remote dependencies."
    >
      <SamplerWorkbench />
    </Surface>
  );
}

function AIPage() {
  return (
    <Surface
      eyebrow="Create"
      title="AI Music"
      description="Local analysis and generation helpers for experimental music workflows."
    >
      <AILabsPanel />
    </Surface>
  );
}

function MidiPage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Perform"
      title="MIDI"
      description="Monitor Web MIDI inputs and live note, controller, and program changes."
    >
      <MidiMonitor />
      <HardwareIntegrationPanel session={session} onSessionChange={setSession} />
    </Surface>
  );
}

function HardwarePage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Perform"
      title="Hardware"
      description="Inspect connected keyboard hardware and local controller mappings."
    >
      <HardwareIntegrationPanel session={session} onSessionChange={setSession} />
    </Surface>
  );
}

function ArrangerPage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Perform"
      title="Arranger"
      description="Work with arranger tools while staying inside the local app."
    >
      <ArrangerPanel session={session} onSessionChange={setSession} />
    </Surface>
  );
}

function ProArrangerPage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Perform"
      title="Pro Arranger"
      description="Advanced arranger and engine tooling for higher-detail keyboard workflows."
    >
      <ArrangerPanel session={session} onSessionChange={setSession} />
      <ProfessionalArrangerPanel />
      <ArrangerEnginePanel />
    </Surface>
  );
}

function SoundLibraryPage() {
  return (
    <Surface
      eyebrow="Library"
      title="Sound Library"
      description="Browse local sound libraries and read metadata safely."
    >
      <LibraryBrowser />
    </Surface>
  );
}

function ProjectsSessionsPage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Projects"
      title="Projects / Sessions"
      description="Open, autosave, and manage local session files."
    >
      <SessionsPanel session={session} onSessionChange={setSession} />
    </Surface>
  );
}

function TimelinePage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Projects"
      title="Timeline"
      description="Arrange song sections and clips in a local timeline."
    >
      <TimelinePanel session={session} onSessionChange={setSession} />
    </Surface>
  );
}

function AccountPage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Settings"
      title="Account"
      description="Local account and cloud-platform controls remain available without enabling payments."
    >
      <CloudPlatformPanel session={session} onSessionChange={setSession} />
    </Surface>
  );
}

function DiagnosticsPage() {
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
    <Surface
      eyebrow="Settings"
      title="Diagnostics"
      description="See what the browser and desktop bridge can actually provide."
    >
      <DiagnosticsPanel />
      <div className="uaosGridTable">
        {rows.map(([label, value]) => (
          <div key={label} className="uaosMiniCard">
            <StatusBadge status={value} />
            <strong>{label}</strong>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function ReleaseStatusPage() {
  const features = detectRuntimeFeatures();
  const rows = [
    ["Browser secure context", features.secureContext ? "available" : "planned"],
    ["MediaDevices", features.microphone ? "available" : "planned"],
    ["Web Audio", features.audioContext ? "available" : "planned"],
    ["MediaRecorder", features.mediaRecorder ? "available" : "planned"],
    ["Web MIDI", features.webMidi ? "experimental" : "planned"],
    ["Electron bridge", features.electronBridge ? "experimental" : "planned"],
    ["Proprietary style parsing", "not-included"],
    ["Paid checkout", "not-enabled"]
  ];

  return (
    <Surface
      eyebrow="Settings"
      title="Release Status"
      description="This page reports the runtime truth, not a marketing promise."
    >
      <RuntimeStatus />
      <div className="uaosGridTable">
        {rows.map(([label, value]) => (
          <div key={label} className="uaosMiniCard">
            <StatusBadge status={value} />
            <strong>{label}</strong>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function DemoPage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Legacy"
      title="Demo"
      description="Public beta and demo content remains available as a separate route."
    >
      <PublicBetaPanel session={session} onSessionChange={setSession} />
    </Surface>
  );
}

function LivePage({ session, setSession }) {
  return (
    <Surface
      eyebrow="Legacy"
      title="Live"
      description="Live arranger monitoring keeps the existing route alive."
    >
      <ArrangerPanel session={session} onSessionChange={setSession} live />
      <MidiMonitor compact />
    </Surface>
  );
}

function AcademyPage() {
  const academy = createAcademyManagerSummary();
  const summary = createAcademyFullSummary();

  return (
    <Surface
      eyebrow="Settings"
      title="Academy"
      description="Local tutorial summaries stay on-device. Public publishing is not enabled."
    >
      <LaunchBanner />
      <div className="uaosGridTable">
        <div className="uaosMiniCard">
          <strong>Total features</strong>
          <span>{summary.totalFeatures}</span>
        </div>
        <div className="uaosMiniCard">
          <strong>Total tutorials</strong>
          <span>{summary.totalTutorials}</span>
        </div>
        <div className="uaosMiniCard">
          <strong>Covered features</strong>
          <span>{summary.coveredFeatures}</span>
        </div>
        <div className="uaosMiniCard">
          <strong>Missing tutorials</strong>
          <span>{summary.missingTutorials}</span>
        </div>
      </div>
      <div className="uaosCardGrid columns-2">
        {academy.lessons.slice(0, 4).map((lesson) => (
          <article className="uaosInfoCard" key={lesson.lessonId}>
            <strong>{lesson.lessonId}: {lesson.titleEn}</strong>
            <span>{lesson.route}</span>
          </article>
        ))}
      </div>
    </Surface>
  );
}

function AppTopBar({ page, onBack, onHome, onSettings }) {
  return (
    <header className="uaosTopBar">
      <button type="button" className="uaosBrand" onClick={onHome} aria-label="UAOS home">
        UAOS
      </button>

      <div className="uaosTopActions">
        <button type="button" onClick={onBack} disabled={page === HOME_PAGE}>
          Back
        </button>
        <button type="button" onClick={onHome}>
          Home
        </button>
        <button
          type="button"
          onClick={onSettings}
          className={page === "settings" ? "active" : ""}
        >
          Settings
        </button>
      </div>
    </header>
  );
}

function AppShell() {
  const [page, setPage] = useState(readHashPage);
  const [previousPage, setPreviousPage] = useState(HOME_PAGE);
  const [lastRoute, setLastRoute] = useState(() => readStoredRoute());
  const [session, setSession] = useState(() => {
    try {
      return loadSession();
    } catch {
      return createDefaultSession();
    }
  });

  useEffect(() => {
    const syncFromHash = () => {
      const next = readHashPage();
      setPage((current) => {
        if (current !== next) {
          setPreviousPage(current);
        }
        return next;
      });
    };

    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  useEffect(() => {
    autosaveSession(session);
  }, [session]);

  useEffect(() => {
    if (page !== HOME_PAGE) {
      setLastRoute(page);
      storeLastRoute(page);
    }
  }, [page]);

  const goHome = () => navigate(HOME_PAGE, setPage, setPreviousPage);
  const goSettings = () => navigate("settings", setPage, setPreviousPage);
  const goBack = () => {
    const target = previousPage && previousPage !== page ? previousPage : lastRoute || HOME_PAGE;
    navigate(target, setPage, setPreviousPage);
  };

  let screen = (
    <ModernHome
      continueRoute={lastRoute}
      onOpen={(id) => navigate(id, setPage, setPreviousPage)}
    />
  );

  if (page === "create") {
    screen = <CreatePage setPage={setPage} setPreviousPage={setPreviousPage} />;
  } else if (page === "perform") {
    screen = <PerformPage setPage={setPage} setPreviousPage={setPreviousPage} />;
  } else if (page === "library") {
    screen = <LibraryPage setPage={setPage} setPreviousPage={setPreviousPage} />;
  } else if (page === "projects") {
    screen = <ProjectsPage setPage={setPage} setPreviousPage={setPreviousPage} />;
  } else if (page === "settings") {
    screen = <SettingsPage setPage={setPage} setPreviousPage={setPreviousPage} />;
  } else if (page === "sing") {
    screen = <SingPage session={session} setSession={setSession} />;
  } else if (page === "studio") {
    screen = <StudioPage session={session} setSession={setSession} />;
  } else if (page === "audio") {
    screen = <AudioPage />;
  } else if (page === "sampler") {
    screen = <SamplerPage />;
  } else if (page === "ai") {
    screen = <AIPage />;
  } else if (page === "midi") {
    screen = <MidiPage session={session} setSession={setSession} />;
  } else if (page === "hardware") {
    screen = <HardwarePage session={session} setSession={setSession} />;
  } else if (page === "arranger") {
    screen = <ArrangerPage session={session} setSession={setSession} />;
  } else if (page === "pro") {
    screen = <ProArrangerPage session={session} setSession={setSession} />;
  } else if (page === "sounds") {
    screen = <SoundLibraryPage />;
  } else if (page === "sessions") {
    screen = <ProjectsSessionsPage session={session} setSession={setSession} />;
  } else if (page === "timeline") {
    screen = <TimelinePage session={session} setSession={setSession} />;
  } else if (page === "account") {
    screen = <AccountPage session={session} setSession={setSession} />;
  } else if (page === "downloads") {
    screen = <DownloadsUpdatePanel />;
  } else if (page === "support") {
    screen = <SupportPage />;
  } else if (page === "diagnostics") {
    screen = <DiagnosticsPage />;
  } else if (page === "academy") {
    screen = <AcademyPage />;
  } else if (page === "pricing") {
    screen = <PricingPage />;
  } else if (page === "privacy") {
    screen = <PrivacyPage />;
  } else if (page === "terms") {
    screen = <TermsPage />;
  } else if (page === "contact") {
    screen = <ContactPage />;
  } else if (page === "status") {
    screen = <ReleaseStatusPage />;
  } else if (page === "demo") {
    screen = <DemoPage session={session} setSession={setSession} />;
  } else if (page === "live") {
    screen = <LivePage session={session} setSession={setSession} />;
  }

  return (
    <div className="uaosAppShell">
      <AppTopBar
        page={page}
        onBack={goBack}
        onHome={goHome}
        onSettings={goSettings}
      />
      {screen}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary
      onError={(error) => eventBus.emit(EVENT_TYPES.RUNTIME_ERROR, { message: error.message })}
    >
      <AppShell />
    </ErrorBoundary>
  );
}


