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

<section className="finalChecklist"><div>Build PASS</div><div>Local site ready</div><div>GitHub pushed</div><div>Deploy retry prepared</div></section>

<section className="finalLaunchLock"><b>UAOS launch package ready.</b><span>Visible site, QA, reports, and retry deploy script are prepared.</span><a href="/universal-arranger-os/launch/status.html">Launch status</a></section>

<section className="premiumSection final31ContentUpgrade" id="faq"><div className="sectionTitle"><p className="spectrumLabel">FAQ</p><h2>Clear answers before public launch.</h2></div><div className="faqGrid"><article><b>Is UAOS public?</b><p>Not yet. The visible website is ready locally and public deploy is waiting for Vercel reset.</p></article><article><b>Does it export real keyboard files?</b><p>No. Real writer and keyboard output remain locked until approved.</p></article><article><b>What is ready?</b><p>Premium website, pricing preview, local QA, launch status, and retry deploy script.</p></article><article><b>What happens next?</b><p>After Vercel reset, run the prepared retry deploy launcher.</p></article></div></section>

<section className="premiumSection ui41LangHub" id="languages"><div className="sectionTitle"><p className="spectrumLabel">Languages</p><h2>UAOS speaks to creators in English, Arabic, and German.</h2></div><div className="langCards"><a href="/universal-arranger-os/pages/marketing-en.html"><b>English</b><span>Global launch copy</span></a><a href="/universal-arranger-os/pages/marketing-ar.html"><b>العربية</b><span>صفحة تسويقية عربية</span></a><a href="/universal-arranger-os/pages/marketing-de.html"><b>Deutsch</b><span>Deutsche Produktseite</span></a></div></section>

<section className="ui42DeployBand"><b>Deploy-ready after Vercel reset.</b><span>Local website is prepared. Public deploy remains intentionally locked until the daily limit resets.</span><a href="/universal-arranger-os/launch/status.html">Check launch status</a></section>

<section className="premiumSection payResumePaymentSection" id="payment"><div className="sectionTitle"><p className="spectrumLabel">Payment readiness</p><h2>UAOS pricing is ready locally. Real payment is locked.</h2></div><div className="payPlans"><article><b>Starter</b><strong>19.99 € / month</strong><p>For singers and creators.</p><a className="mainBtn" href="/universal-arranger-os/checkout/starter.html">Start with Starter</a><button disabled>PayPal Placeholder</button><button disabled>Card Placeholder</button></article><article className="featuredPay"><b>Pro</b><strong>49.99 € / month</strong><p>For serious creators and studios.</p><a className="mainBtn" href="/universal-arranger-os/checkout/pro.html">Choose Pro</a><button disabled>PayPal Placeholder</button><button disabled>Card Placeholder</button></article><article><b>Studio</b><strong>99.99 € / month or Contact</strong><p>For business/studio planning.</p><a className="ghostBtn" href="/universal-arranger-os/checkout/studio.html">Contact for Studio</a><button disabled>Manual Invoice Placeholder</button><button disabled>Payment activation pending approval</button></article></div><p className="paymentLockNote">Payment not active yet. No PayPal live, no card checkout, no subscription activation.</p></section>

<section className="premiumSection pay1214CommercialLinks"><div className="sectionTitle"><p className="spectrumLabel">Commercial checkout</p><h2>Pricing, checkout, invoice, and PayPal readiness are prepared locally.</h2></div><div className="commercialLinkGrid"><a href="/universal-arranger-os/commercial/pricing-comparison.html"><b>Pricing comparison</b><span>Compare Starter, Pro, Studio</span></a><a href="/universal-arranger-os/paypal/sandbox-checkout-preview.html"><b>PayPal Sandbox Preview</b><span>No live payments</span></a><a href="/universal-arranger-os/checkout/manual-invoice.html"><b>Manual Invoice</b><span>Business placeholder</span></a><a href="/universal-arranger-os/legal/payment-terms.html"><b>Payment Terms</b><span>Legal placeholder</span></a></div></section>

<section className="premiumSection pay1520UpgradeLinks"><div className="sectionTitle"><p className="spectrumLabel">Upgrade flow</p><h2>Upgrade, success, cancel, and invoice pages are ready as safe placeholders.</h2></div><div className="upgradeLinkGrid"><a href="/universal-arranger-os/checkout/upgrade.html"><b>Upgrade Center</b><span>Compare and choose a plan</span></a><a href="/universal-arranger-os/checkout/success.html"><b>Success Placeholder</b><span>No real payment</span></a><a href="/universal-arranger-os/checkout/cancel.html"><b>Cancel Placeholder</b><span>Safe checkout cancel route</span></a><a href="/universal-arranger-os/checkout/invoice-request.html"><b>Invoice Request</b><span>Manual business placeholder</span></a></div></section>

<section className="premiumSection pay2126SandboxGateLinks"><div className="sectionTitle"><p className="spectrumLabel">Sandbox gate</p><h2>Payment sandbox is prepared but still locked until explicit approval.</h2></div><div className="sandboxGateGrid"><a href="/universal-arranger-os/paypal/sandbox-approval-gate.html"><b>Sandbox Approval Gate</b><span>No client ID stored</span></a><a href="/universal-arranger-os/commercial/payment-activation-checklist.html"><b>Activation Checklist</b><span>Legal/tax/sandbox steps</span></a><a href="/universal-arranger-os/qa/payment-admin-status.html"><b>Payment Admin Status</b><span>Local readiness dashboard</span></a></div></section>

<section className="premiumSection pay2734FinalCommercialGate"><div className="sectionTitle"><p className="spectrumLabel">Final commercial gate</p><h2>Payment routes are complete locally, but activation remains locked.</h2></div><div className="finalCommercialGrid"><a href="/universal-arranger-os/commercial/payment-sitemap.html"><b>Payment Sitemap</b><span>All local payment routes</span></a><a href="/universal-arranger-os/commercial/pricing-faq.html"><b>Pricing FAQ</b><span>Clear payment answers</span></a><a href="/universal-arranger-os/checkout/payment-waitlist.html"><b>Payment Waitlist</b><span>Safe pre-launch placeholder</span></a><a href="/universal-arranger-os/checkout/contact-sales.html"><b>Contact Sales</b><span>Business placeholder</span></a><a href="/universal-arranger-os/legal/germany-eu-tax-readiness.html"><b>Germany/EU Tax</b><span>Review required before live</span></a></div></section>

<section className="premiumSection pay4752FinalPaymentNav"><div className="sectionTitle"><p className="spectrumLabel">Checkout is locked</p><h2>All buy buttons route to safe placeholder checkout pages.</h2></div><div className="finalPaymentNavGrid"><a href="/universal-arranger-os/commercial/payment-navigation.html"><b>Payment Navigation</b><span>All routes in one place</span></a><a href="/universal-arranger-os/checkout/checkout-status.html"><b>Checkout Status</b><span>Payment not active</span></a><a href="/universal-arranger-os/commercial/public-payment-status.html"><b>Public Payment Status</b><span>Safe for placeholder publishing</span></a><a href="/universal-arranger-os/commercial/payment-sitemap.html"><b>Payment Sitemap</b><span>Commercial route map</span></a></div></section>

<footer className="premiumFooter">
        <b>UAOS</b>
        <span>Universal Arranger OS · Premium local product preview</span>
      </footer>
    </main>
  );
}
















