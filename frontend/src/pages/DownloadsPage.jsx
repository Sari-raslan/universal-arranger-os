import React from 'react';

const GITHUB_URL = 'https://github.com/Sari-raslan/universal-arranger-os';
const RELEASES_URL = 'https://github.com/Sari-raslan/universal-arranger-os/releases';

export default function DownloadsPage() {
  return (
    <main style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
      <h1>Downloads</h1>
      <p>Download the latest UAOS builds.</p>

      <ul>
        <li><a href={RELEASES_URL}>Windows Installer / Portable Builds</a></li>
        <li><a href={RELEASES_URL}>Android APK</a></li>
        <li><a href={GITHUB_URL}>Source Repository</a></li>
      </ul>

      <p>
        Google Play AAB is prepared but public Play Store publishing requires a Google Play Console account.
      </p>
    </main>
  );
}
