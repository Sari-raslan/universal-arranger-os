import React from "react";

const publisher = "Sarey Raslan";
const supportEmail = "";
const legalAddress = "";

export function LaunchBanner() {
  return (
    <section
      className="launchBanner"
      role="status"
      aria-label="UAOS release status"
    >
      <strong>UAOS Public Preview</strong>
      <span>
        Free evaluation release - RELEASE_CANDIDATE_READY_UNSIGNED.
      </span>
      <span>
        Payments, production activation, signed installers, and app-store
        releases are not enabled.
      </span>
    </section>
  );
}

function Page({ eyebrow, title, children }) {
  return (
    <main className="page">
      <section className="panel legalPage">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

function EmailLink() {
  if (!supportEmail) {
    return (
      <p className="launchWarning">
        A public support email has not been configured yet.
      </p>
    );
  }

  return (
    <p>
      Email:{" "}
      <a href={"mailto:" + supportEmail}>
        {supportEmail}
      </a>
    </p>
  );
}

export function SupportPage() {
  return (
    <Page eyebrow="Support" title="UAOS Support">
      <p>
        For preview feedback, include your browser, operating system,
        route, and the exact error message.
      </p>

      <EmailLink />

      <p>
        This preview does not include guaranteed response times or
        production service-level commitments.
      </p>
    </Page>
  );
}

export function ContactPage() {
  return (
    <Page eyebrow="Contact" title="Contact UAOS">
      <p>
        Publisher: {publisher || "Publisher details pending"}
      </p>

      <EmailLink />
    </Page>
  );
}

export function ImpressumPage() {
  const complete = Boolean(
    publisher &&
    supportEmail &&
    legalAddress
  );

  return (
    <Page eyebrow="Publisher information" title="Impressum">
      <p>
        <strong>{publisher || "Publisher name required"}</strong>
      </p>

      {legalAddress ? (
        <p className="preLine">{legalAddress}</p>
      ) : (
        <p className="launchWarning">
          A legally serviceable address must be added before commercial
          activation.
        </p>
      )}

      <EmailLink />

      {!complete && (
        <p className="launchWarning">
          Commercial checkout remains disabled until publisher information
          and legal review are complete.
        </p>
      )}

      <p>
        UAOS / Universal Arranger OS is currently released as a free
        software preview.
      </p>
    </Page>
  );
}

export function PrivacyPage() {
  return (
    <Page eyebrow="Privacy" title="Privacy Notice - Public Preview">
      <p>
        UAOS is designed as a local-first browser application. Sessions
        may be stored in your browser or local desktop environment.
      </p>

      <p>
        Microphone and MIDI access are requested only through browser or
        desktop permission controls.
      </p>

      <p>
        No production payment provider, advertising system, or cloud AI
        model is enabled in this preview release.
      </p>

      <p>
        Local preview data can be removed by clearing UAOS browser storage
        or deleting locally saved projects.
      </p>

      <p className="launchWarning">
        This operational notice must be reviewed and completed before
        commercial activation.
      </p>
    </Page>
  );
}

export function TermsPage() {
  return (
    <Page eyebrow="Terms" title="Public Preview Terms">
      <p>
        UAOS Public Preview is provided for testing and evaluation.
        Experimental features may change or fail.
      </p>

      <p>
        Do not rely on this preview for safety-critical performances,
        irreplaceable recordings, or sole-copy project storage.
      </p>

      <p>
        Only process material you own or are authorized to use.
        Proprietary commercial style parsing and commercial sampled
        libraries are not included.
      </p>

      <p>
        No paid subscription, production activation, signed installer,
        or app-store purchase is offered through this preview.
      </p>

      <p className="launchWarning">
        Final commercial terms, cancellation, refund, and consumer
        information require publisher approval before checkout is enabled.
      </p>
    </Page>
  );
}
