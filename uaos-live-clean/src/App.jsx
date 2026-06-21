import "./App.css";

export default function App() {
  return (
    <main className="activeProof">
      <nav className="proofNav">
        <div className="proofBrand">
          <span>UAOS</span>
          <b>Universal Arranger OS</b>
        </div>
        <div className="proofLinks">
          <a href="#demo">Demo</a>
          <a href="#pricing">Pricing</a>
          <a href="#launch">Launch</a>
        </div>
      </nav>

      <section className="proofHero">
        <div>
          <p className="proofBadge">✅ NEW ACTIVE APP CONFIRMED</p>
          <h1>UAOS visual redesign is now loaded from the active Vite app.</h1>
          <p>
            إذا كنت تشوف هذه الصفحة، معناها نحن أخيراً نعدل الملف الصحيح والسيرفر الصحيح.
            بعدها نكمل التصميم الحقيقي فوق هذا الملف.
          </p>
          <div className="proofButtons">
            <a href="#demo">Start Demo</a>
            <a href="#pricing">Choose Plan</a>
          </div>
        </div>

        <aside className="proofPanel" id="demo">
          <h2>Live Preview</h2>
          <div className="proofTrack">Voice → MIDI planning</div>
          <div className="proofTrack">Chords → Arrangement</div>
          <div className="proofTrack">Studio → Release prep</div>
        </aside>
      </section>

      <section className="proofSection" id="pricing">
        <h2>Pricing Preview</h2>
        <div className="proofCards">
          <article><h3>Starter</h3><strong>€19.99/mo</strong><p>For singers and creators.</p></article>
          <article><h3>Pro</h3><strong>€49.99/mo</strong><p>For studios and arranger pros.</p></article>
        </div>
      </section>

      <section className="proofSection" id="launch">
        <h2>Launch Status</h2>
        <p>Local UI is active. Public deploy waits for Vercel daily limit reset.</p>
      </section>
    </main>
  );
}

