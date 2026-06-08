import React from "react";

const LINKS = {
  website: "https://uaos-public-live.vercel.app",
  github: "https://github.com/Sari-raslan/universal-arranger-os",
  release: "https://github.com/Sari-raslan/universal-arranger-os/releases/tag/v0.1.0-debug",
  androidApk: "https://github.com/Sari-raslan/universal-arranger-os/releases/download/v0.1.0-debug/UAOS-debug.apk",
  windowsZip: "https://github.com/Sari-raslan/universal-arranger-os/releases/download/v0.1.0-debug/UAOS-Windows-Desktop.zip",
  paypal: "https://www.paypal.com/ncp/payment/2W2D2VXEDNTBU"
};

function DownloadCard({ icon, title, text, href, fileName, primaryLabel, secondaryHref, secondaryLabel }) {
  return (
    <article className="uaos-launch-card">
      <h3>{icon} {title}</h3>
      <p>{text}</p>

      <div className="uaos-button-row">
        <a className="uaos-button" href={href} download={fileName} target="_blank" rel="noopener noreferrer">
          {primaryLabel}
        </a>

        {secondaryHref ? (
          <a className="uaos-button secondary" href={secondaryHref} target="_blank" rel="noopener noreferrer">
            {secondaryLabel}
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function DownloadsPage() {
  return (
    <main className="uaos-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 22px" }}>
      <p className="uaos-kicker">UAOS Downloads</p>
      <h1 className="uaos-hero-title">Download UAOS</h1>

      <p style={{ fontSize: 20, maxWidth: 900, lineHeight: 1.8 }}>
        كل زر تحميل هنا يذهب مباشرة إلى ملف التحميل وليس إلى صفحة GitHub.
        <br />
        Each download button goes directly to the file, not the GitHub release page.
        <br />
        Jeder Download-Button führt direkt zur Datei.
      </p>

      <div className="uaos-launch-grid">
        <DownloadCard
          icon="🌐"
          title="Web App"
          text="افتح UAOS من المتصفح مباشرة."
          href={LINKS.website}
          primaryLabel="Open Web App"
        />

        <DownloadCard
          icon="📱"
          title="Android APK"
          text="تحميل مباشر لملف Android APK التجريبي."
          href={LINKS.androidApk}
          fileName="UAOS-debug.apk"
          primaryLabel="Download Android APK"
          secondaryHref={LINKS.release}
          secondaryLabel="Release Info"
        />

        <DownloadCard
          icon="🖥️"
          title="Windows Desktop ZIP"
          text="تحميل مباشر لنسخة Windows Desktop. فك الضغط ثم شغّل UAOS.exe."
          href={LINKS.windowsZip}
          fileName="UAOS-Windows-Desktop.zip"
          primaryLabel="Download Windows ZIP"
          secondaryHref={LINKS.github}
          secondaryLabel="Source Code"
        />
      </div>

      <div className="uaos-final-links">
        <h2>Direct Downloads</h2>
        <p><b>Android APK:</b><br /><a href={LINKS.androidApk} download="UAOS-debug.apk">{LINKS.androidApk}</a></p>
        <p><b>Windows ZIP:</b><br /><a href={LINKS.windowsZip} download="UAOS-Windows-Desktop.zip">{LINKS.windowsZip}</a></p>
        <p><b>PayPal:</b><br /><a href={LINKS.paypal}>{LINKS.paypal}</a></p>
      </div>
    </main>
  );
}