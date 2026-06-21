import "./App.css";

const products = [
  ["UAOS Sing", "Sing or upload vocals and turn ideas into arranged demos.", "For singers"],
  ["UAOS Studio", "Build songs with tracks, MIDI ideas, projects, and local workflow.", "For creators"],
  ["UAOS Pro Arranger", "Plan future KORG, Yamaha, Roland, Ketron workflows safely.", "For professionals"]
];

const features = [
  "Voice-to-MIDI prototype foundation",
  "Real MIDI engine foundation",
  "Style generation planning",
  "DAW export planning",
  "Hardware mapper planning",
  "Local-first safe workflow"
];

export default function App() {
  return (
    <main className="uaos-site">
      <nav className="uaos-nav">
        <div className="brand">
          <span className="logo">UAOS</span>
          <span>Universal Arranger OS</span>
        </div>
        <div className="nav-links">
          <a href="#demo">Demo</a>
          <a href="#products">Products</a>
          <a href="#pricing">Pricing</a>
          <a href="#downloads">Downloads</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Local Release Candidate • Visible Website UI</p>
          <h1>Turn voice, MIDI, and arranger ideas into a modern music workstation.</h1>
          <p className="lead">
            UAOS is being built as a local-first AI arranger platform for singers, creators,
            and professional keyboard players. This visible UI is now the real main website preview.
          </p>
          <div className="actions">
            <a className="btn primary" href="#demo">Start Free Demo</a>
            <a className="btn secondary" href="#pricing">Choose Plan</a>
          </div>
          <div className="status-row">
            <span>Build: PASS</span>
            <span>Deploy: waiting for Vercel limit</span>
            <span>Mode: local preview</span>
          </div>
        </div>
        <div className="hero-panel" id="demo">
          <h2>UAOS Live Preview</h2>
          <div className="screen">
            <div className="meter"><span style={{width:"88%"}} /></div>
            <div className="tracks">
              <div>Vocal → MIDI</div>
              <div>Chord Map</div>
              <div>Style Sections</div>
              <div>DAW Export</div>
            </div>
          </div>
          <p>No real keyboard writer, parser, or deploy is enabled in this UI fix.</p>
        </div>
      </section>

      <section className="section" id="products">
        <h2>Three products, one platform</h2>
        <div className="cards">
          {products.map(([title, text, tag]) => (
            <article className="card" key={title}>
              <span className="tag">{tag}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <a className="small-link" href="#pricing">View plan →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <h2>What is ready now?</h2>
          <ul className="feature-list">
            {features.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
        <div className="notice">
          <h3>Safe boundaries</h3>
          <p>
            No .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output, no production parser,
            no fixtures handling, and no public deploy in this step.
          </p>
        </div>
      </section>

      <section className="section" id="pricing">
        <h2>Simple pricing preview</h2>
        <div className="pricing">
          <article className="price">
            <h3>Starter</h3>
            <strong>€19.99/mo</strong>
            <p>For singers and creators testing song ideas.</p>
            <a className="btn primary" href="#demo">Start Demo</a>
          </article>
          <article className="price featured">
            <h3>Pro</h3>
            <strong>€49.99/mo</strong>
            <p>For arrangers, studio workflow, and advanced planning.</p>
            <a className="btn secondary" href="#downloads">Get Ready</a>
          </article>
        </div>
      </section>

      <section className="section" id="downloads">
        <h2>Downloads</h2>
        <p className="lead">
          Desktop and mobile packages are not publicly released in this step.
          This page is a visible commercial preview only.
        </p>
        <div className="actions">
          <a className="btn primary" href="/">Back Home</a>
          <a className="btn secondary" href="/universal-arranger-os/governance/y2041-y2400/final-rc-lock.html">RC Lock</a>
        </div>
      </section>
    </main>
  );
}
