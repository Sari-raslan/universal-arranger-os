import "./App.css";

const products = [
  {
    title: "UAOS Sing",
    label: "For singers",
    text: "Capture a vocal idea and shape it into a clean demo direction with melody, structure, and arrangement planning."
  },
  {
    title: "UAOS Studio",
    label: "For creators",
    text: "Plan tracks, MIDI ideas, song sections, and local project workflow in one focused creative workspace."
  },
  {
    title: "UAOS Pro Arranger",
    label: "For professionals",
    text: "Prepare advanced arranger workflows for future approved hardware export and studio production paths."
  }
];

const workflow = [
  ["01", "Start with an idea", "Sing, write, or plan a musical phrase and turn it into a structured direction."],
  ["02", "Build the arrangement", "Map sections, chords, tracks, and production flow with a local-first workflow."],
  ["03", "Prepare the release", "Review the product, pricing, support, and launch status before public deployment retry."]
];

const pricing = [
  ["Starter", "€19.99", "For singers and creators testing ideas, demos, and early song directions."],
  ["Pro", "€49.99", "For studios, arrangers, and advanced users planning professional workflows."]
];

export default function App() {
  return (
    <main className="siteShell">
      <header className="siteHeader">
        <a className="brandMark" href="#home">
          <span className="brandIcon">UA</span>
          <span>
            <strong>UAOS</strong>
            <small>Universal Arranger OS</small>
          </span>
        </a>

        <nav className="mainNav">
          <a href="#demo">Demo</a>
          <a href="#products">Products</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <a href="#downloads">Downloads</a>
          <a href="#support">Support</a>
        </nav>

        <a className="accountLink" href="#support">Account</a>
      </header>

      <section className="heroSection" id="home">
        <div className="heroCopy">
          <p className="eyebrow">AI music workstation · Local preview</p>
          <h1>Arrange songs faster from voice, MIDI, and creative ideas.</h1>
          <p className="heroLead">
            UAOS is a modern arranger platform for singers, creators, studios, and keyboard professionals.
            Build musical direction, structure songs, preview product workflows, and prepare for public launch.
          </p>

          <div className="heroActions">
            <a className="btn primaryBtn" href="#demo">Start demo</a>
            <a className="btn secondaryBtn" href="#pricing">View pricing</a>
          </div>

          <div className="trustRow">
            <span>Local UI ready</span>
            <span>Build passes</span>
            <span>Deploy retry pending</span>
          </div>
        </div>

        <aside className="demoCard" id="demo">
          <div className="demoCardHeader">
            <span></span><span></span><span></span>
            <p>Live arrangement preview</p>
          </div>

          <div className="arrangerMock">
            <div className="mockRow active">
              <b>Voice idea</b>
              <span>Melody planning</span>
            </div>
            <div className="mockRow">
              <b>Chord map</b>
              <span>Verse · Chorus · Bridge</span>
            </div>
            <div className="mockRow">
              <b>Studio tracks</b>
              <span>Drums · Bass · Keys · Guide</span>
            </div>
            <div className="mockRow locked">
              <b>Hardware output</b>
              <span>Locked until separate approval</span>
            </div>
          </div>

          <div className="miniKeyboard">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </aside>
      </section>

      <section className="section" id="products">
        <div className="sectionHead">
          <p className="eyebrow">Products</p>
          <h2>Three clear paths for different musicians.</h2>
        </div>

        <div className="productGrid">
          {products.map((item) => (
            <article className="productCard" key={item.title}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <a href="#pricing">Explore plan</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section workflowSection" id="workflow">
        <div className="sectionHead">
          <p className="eyebrow">Workflow</p>
          <h2>Simple enough to start, structured enough to grow.</h2>
        </div>

        <div className="workflowGrid">
          {workflow.map(([number, title, text]) => (
            <article className="workflowStep" key={number}>
              <strong>{number}</strong>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section pricingSection" id="pricing">
        <div className="sectionHead">
          <p className="eyebrow">Pricing</p>
          <h2>Clean pricing preview for the first public release.</h2>
        </div>

        <div className="pricingGrid">
          {pricing.map(([name, price, text], index) => (
            <article className={index === 1 ? "priceCard highlighted" : "priceCard"} key={name}>
              <h3>{name}</h3>
              <strong>{price}<small>/mo</small></strong>
              <p>{text}</p>
              <a className={index === 1 ? "btn primaryBtn" : "btn secondaryBtn"} href="#support">
                {index === 1 ? "Request access" : "Start demo"}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section launchPanel" id="downloads">
        <div>
          <p className="eyebrow">Downloads</p>
          <h2>Local release candidate is ready. Public deploy retry comes next.</h2>
          <p>
            Vercel daily deployment limit stopped the last public deploy. The site is ready locally;
            retry production deployment after the limit resets.
          </p>
        </div>
        <a className="btn primaryBtn" href="/universal-arranger-os/launch/status.html">Launch status</a>
      </section>

      <section className="section supportSection" id="support">
        <div className="sectionHead">
          <p className="eyebrow">Support</p>
          <h2>Built for a serious music product launch.</h2>
        </div>

        <div className="supportGrid">
          <article>
            <h3>For singers</h3>
            <p>Turn rough vocal ideas into structured demo direction.</p>
          </article>
          <article>
            <h3>For studios</h3>
            <p>Use the platform direction for tracks, production planning, and client demos.</p>
          </article>
          <article>
            <h3>For arranger pros</h3>
            <p>Advanced hardware outputs stay locked until explicitly approved.</p>
          </article>
          <article>
            <h3>For launch</h3>
            <p>Public deployment can resume after Vercel deployment limits reset.</p>
          </article>
        </div>
      </section>

      <footer className="siteFooter">
        <strong>UAOS</strong>
        <span>Universal Arranger OS · Local product preview · Public deploy retry pending</span>
      </footer>
    </main>
  );
}
