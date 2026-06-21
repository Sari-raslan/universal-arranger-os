import "./App.css";

const products = [
  ["UAOS Sing", "For singers who want to sing ideas and shape them into arranged demos.", "Start Demo"],
  ["UAOS Studio", "For creators building tracks, MIDI ideas, local projects, and song structure.", "Open Studio"],
  ["UAOS Pro Arranger", "For advanced arranger workflows, hardware planning, and professional preparation.", "View Pro"]
];

const steps = [
  ["1", "Sing or import idea", "Start from a vocal, melody, or rough song concept."],
  ["2", "Arrange locally", "Shape tracks, sections, chords, and MIDI planning safely."],
  ["3", "Prepare release", "Move from local preview to public launch after deployment unlock."]
];

const locks = [
  "No deploy in FINAL-01",
  "No writer implementation",
  "No real keyboard output",
  "No production parser",
  "No fixtures access",
  "No .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST"
];

export default function App() {
  return (
    <main className="uaos">
      <nav className="topbar">
        <a className="brand" href="#home"><b>UAOS</b><span>Universal Arranger OS</span></a>
        <div className="nav">
          <a href="#demo">Demo</a>
          <a href="#products">Products</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <a href="#downloads">Downloads</a>
          <a href="#support">Support</a>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="heroText">
          <p className="pill">FINAL-01 • Visible Product Completion UI Pack</p>
          <h1>AI Arranger Platform for singers, creators, and keyboard professionals.</h1>
          <p className="lead">
            This is the real visible UAOS product front page. It now shows a commercial landing page,
            product sections, demo flow, pricing preview, downloads, support, and launch status.
          </p>
          <div className="ctaRow">
            <a className="btn hot" href="#demo">▶ Start Free Demo</a>
            <a className="btn" href="#pricing">💎 Choose Plan</a>
            <a className="btn ghost" href="/universal-arranger-os/launch/status.html">Launch Status</a>
          </div>
          <div className="miniStats">
            <span>Local UI: Updated</span>
            <span>Build: Required PASS</span>
            <span>Deploy: waiting Vercel reset</span>
          </div>
        </div>

        <div className="preview" id="demo">
          <div className="previewTop"><span></span><span></span><span></span></div>
          <h2>Live Demo Preview</h2>
          <div className="module active">Voice idea → MIDI planning</div>
          <div className="module">Chord map → arrangement sections</div>
          <div className="module">Studio tracks → release preparation</div>
          <div className="module locked">Keyboard writer locked until separate approval</div>
        </div>
      </section>

      <section className="section" id="products">
        <p className="pill">Products</p>
        <h2>One platform, three clear products.</h2>
        <div className="grid3">
          {products.map(([title, text, action]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
              <a className="smallBtn" href="#pricing">{action}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section split" id="workflow">
        <div>
          <p className="pill">Workflow</p>
          <h2>From idea to launch-ready product page.</h2>
          <div className="steps">
            {steps.map(([n,t,d]) => (
              <div className="step" key={n}><b>{n}</b><div><h3>{t}</h3><p>{d}</p></div></div>
            ))}
          </div>
        </div>
        <aside className="safeBox">
          <h3>Safety locks active</h3>
          <ul>{locks.map(x => <li key={x}>{x}</li>)}</ul>
        </aside>
      </section>

      <section className="section pricing" id="pricing">
        <p className="pill">Pricing preview</p>
        <h2>Simple commercial direction.</h2>
        <div className="grid2">
          <article className="price">
            <h3>Starter</h3>
            <strong>€19.99/mo</strong>
            <p>For singers and content creators who need fast arranged demos.</p>
            <a className="btn hot" href="#demo">Start Free Demo</a>
          </article>
          <article className="price featured">
            <h3>Pro</h3>
            <strong>€49.99/mo</strong>
            <p>For studios and arranger professionals planning advanced workflows.</p>
            <a className="btn" href="#support">Request Access</a>
          </article>
        </div>
      </section>

            <section className="section trust" id="trust">
        <p className="pill">FINAL-05 Product Trust</p>
        <h2>Why UAOS is different</h2>
        <div className="grid3">
          <article className="card"><h3>Local-first</h3><p>Work safely on your machine before any public release or cloud workflow.</p></article>
          <article className="card"><h3>Musician-focused</h3><p>Built around singers, MIDI, song structure, arranger workflows, and creators.</p></article>
          <article className="card"><h3>Clear safety gates</h3><p>Real writer, parser, fixtures, and keyboard output stay locked until explicitly approved.</p></article>
        </div>
      </section>

      <section className="section downloads" id="downloads">
        <p className="pill">Downloads</p>
        <h2>Release Candidate downloads are not public yet.</h2>
        <p className="lead">
          Public deploy was blocked by the Vercel daily deployment limit. The UI is ready locally;
          retry deployment after the limit resets.
        </p>
        <div className="ctaRow">
          <a className="btn hot" href="/universal-arranger-os/launch/status.html">View Launch Status</a>
          <a className="btn ghost" href="#home">Back to Top</a>
        </div>
      </section>

            <section className="section launchChecklist">
        <p className="pill">FINAL-06 Launch Checklist</p>
        <h2>Before public launch retry</h2>
        <div className="checklist">
          <span>✓ Main website visible locally</span>
          <span>✓ Launch status page exists</span>
          <span>✓ Build passes</span>
          <span>✓ Git push ready</span>
          <span>✓ Deploy retry waits for Vercel reset</span>
          <span>✓ No writer/parser/output unlocked</span>
        </div>
      </section>

      <section className="section support" id="support">
        <p className="pill">Support</p>
        <h2>Next: polish, screenshots, videos, and public launch retry.</h2>
        <div className="grid3">
          <article className="card"><h3>UI Polish</h3><p>Improve visuals, buttons, mobile layout, and product clarity.</p></article>
          <article className="card"><h3>QA</h3><p>Run local route checks, build verification, and launch status validation.</p></article>
          <article className="card"><h3>Deploy Retry</h3><p>After 24 hours, retry Vercel production deploy and public route verification.</p></article>
        </div>
      </section>

            <section className="section nextAction">
        <p className="pill">FINAL-07 Next Action</p>
        <h2>Next step after Vercel limit resets</h2>
        <p className="lead">Run the generated retry script only after the Vercel daily deployment limit resets.</p>
        <div className="ctaRow">
          <a className="btn hot" href="/universal-arranger-os/launch/status.html">Open Launch Status</a>
          <a className="btn ghost" href="#home">Back Home</a>
        </div>
      </section>

      <footer className="footer">
        <b>UAOS</b>
        <span>Visible product completion preview • FINAL-01 • No deploy in this step</span>
      </footer>
    </main>
  );
}

