import "./App.css";

const products = [
  ["UAOS Sing", "For singers", "Sing an idea and turn it into a clean arranged demo direction."],
  ["UAOS Studio", "For creators", "Build song structure, MIDI ideas, sections, tracks, and studio planning."],
  ["UAOS Pro Arranger", "For professionals", "Prepare advanced arranger workflows for future approved hardware paths."]
];

const workflow = [
  ["01", "Capture", "Start from voice, melody, chords, or a rough musical idea."],
  ["02", "Arrange", "Shape sections, tracks, MIDI direction, and production flow."],
  ["03", "Launch", "Prepare pricing, downloads, support, and public deployment retry."]
];

export default function App() {
  return (
    <main className="uaosPremium">
      <header className="premiumNav">
        <a className="premiumBrand" href="#home">
          <span>UAOS</span>
          <div>
            <b>Universal Arranger OS</b>
            <small>AI Music Workstation</small>
          </div>
        </a>

        <nav>
          <a href="#demo">Demo</a>
          <a href="#products">Products</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <a href="#support">Support</a>
        </nav><div className="languageSwitch"><span>EN</span><b>AR</b></div></header>

      <section className="premiumHero" id="home">
        <div className="heroText">
          <p className="spectrumLabel">AI arranger platform · local product preview</p>
          <h1>
            Arrange songs from <span>voice</span>, <span>MIDI</span>, and <span>creative ideas</span>.
          </h1>
          <p className="heroLead">
            UAOS is a modern music workstation for singers, creators, studios, and arranger keyboard professionals.
            Build musical direction, shape arrangements, preview product workflows, and prepare for public launch.
          </p>

          <div className="heroButtons">
            <a className="mainBtn" href="#demo">Start demo</a>
            <a className="ghostBtn" href="#pricing">Choose plan</a>
            <a className="ghostBtn" href="/universal-arranger-os/launch/status.html">Launch status</a>
          </div>

          <div className="statusPills">
            <span>Local UI ready</span>
            <span>Build passes</span>
            <span>Deploy retry ready</span>
          </div>
        </div>

        <aside className="premiumPreview" id="demo">
          <div className="windowDots"><i></i><i></i><i></i><b>Live arrangement preview</b></div>
          <div className="previewRow active"><strong>Voice idea</strong><span>Melody planning</span></div>
          <div className="previewRow"><strong>Chord map</strong><span>Verse · Chorus · Bridge</span></div>
          <div className="previewRow"><strong>Studio tracks</strong><span>Drums · Bass · Keys</span></div>
          <div className="previewRow locked"><strong>Hardware output</strong><span>Locked until approval</span></div>
          <div className="keys"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </aside>
      </section>

      <section className="proofStrip"><span>For singers</span><span>For creators</span><span>For studios</span><span>For arranger professionals</span></section>

<section className="premiumSection" id="products">
        <div className="sectionTitle">
          <p className="spectrumLabel">Products</p>
          <h2>Three clear paths, one music platform.</h2>
        </div>

        <div className="cards3">
          {products.map(([title, tag, text]) => (
            <article className="glassCard" key={title}>
              <span>{tag}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <a href="#pricing">Explore →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="premiumSection" id="workflow">
        <div className="sectionTitle">
          <p className="spectrumLabel">Workflow</p>
          <h2>From raw idea to launch-ready direction.</h2>
        </div>

        <div className="workflow">
          {workflow.map(([num, title, text]) => (
            <article className="flowStep" key={num}>
              <b>{num}</b>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="premiumSection screenshotWall" id="screens"><div className="sectionTitle"><p className="spectrumLabel">Preview</p><h2>Product screens that explain the vision faster.</h2></div><div className="screenGrid"><article><b>Sing Mode</b><span>Voice idea to arranged direction</span></article><article><b>Studio Mode</b><span>Tracks, chords, MIDI and song flow</span></article><article><b>Pro Arranger</b><span>Professional workflow planning</span></article></div></section>

<section className="premiumSection pricing" id="pricing">
        <div className="sectionTitle">
          <p className="spectrumLabel">Pricing</p>
          <h2>Simple pricing preview.</h2>
        </div>

        <div className="priceGrid">
          <article className="priceCard">
            <h3>Starter</h3>
            <strong>€19.99<small>/mo</small></strong>
            <p>For singers and creators testing fast demo ideas.</p>
            <a className="ghostBtn" href="#demo">Start demo</a>
          </article>
          <article className="priceCard pro">
            <h3>Pro</h3>
            <strong>€49.99<small>/mo</small></strong>
            <p>For studios and arranger professionals planning advanced workflows.</p>
            <a className="mainBtn" href="#support">Request access</a>
          </article>
        </div>
      </section>

      <section className="premiumSection comparisonSection"><div className="sectionTitle"><p className="spectrumLabel">Why UAOS</p><h2>Less scattered tools. More musical direction.</h2></div><div className="compareGrid"><article><b>Before</b><p>Ideas, voice notes, MIDI, tracks, pricing, and launch tasks are separated.</p></article><article><b>With UAOS</b><p>One focused product direction for demo creation, arrangement planning, and launch readiness.</p></article></div></section>

<section className="launchStrip">
        <div>
          <p className="spectrumLabel">Launch</p>
          <h2>Ready locally. Public deploy retry after Vercel reset.</h2>
          <p>No writer, no parser, no keyboard output, no fixtures. Public deployment waits for the Vercel daily limit reset.</p>
        </div>
        <a className="mainBtn" href="/universal-arranger-os/launch/status.html">Open status</a>
      </section>

      <section className="premiumSection" id="support">
        <div className="sectionTitle">
          <p className="spectrumLabel">Support</p>
          <h2>Built for a serious music product launch.</h2>
        </div>

        <div className="cards3 supportGrid">
          <article className="glassCard"><h3>Singers</h3><p>Turn rough vocals into arranged demo direction.</p></article>
          <article className="glassCard"><h3>Studios</h3><p>Plan tracks, song sections, and release-ready workflows.</p></article>
          <article className="glassCard"><h3>Arranger Pros</h3><p>Advanced exports stay locked until a separate approval path.</p></article>
        </div>
      </section>

      <section className="finalCta"><p className="spectrumLabel">Ready to continue</p><h2>Build the product locally today. Retry public deploy after Vercel resets.</h2><div><a className="mainBtn" href="#demo">Open demo</a><a className="ghostBtn" href="/universal-arranger-os/launch/status.html">Launch status</a></div></section>

<section className="finalReadyStrip"><b>UAOS is locally ready.</b><span>Visual product site, pricing preview, launch status, and deploy retry path are prepared.</span><a href="/universal-arranger-os/launch/status.html">Launch status</a></section>

<section className="finalLaunchLock"><b>UAOS launch package ready.</b><span>Visible site, QA, reports, and retry deploy script are prepared.</span><a href="/universal-arranger-os/launch/status.html">Launch status</a></section>

<footer className="premiumFooter">
        <b>UAOS</b>
        <span>Universal Arranger OS · Premium local product preview</span>
      </footer>
    </main>
  );
}






