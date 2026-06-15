import { useEffect, useMemo, useState } from "react";

const CURRENT_VERSION = "11.2.0";
const REPOSITORY = "Sari-raslan/universal-arranger-os";
const RELEASES_API =
  `https://api.github.com/repos/${REPOSITORY}/releases?per_page=10`;

function normalizeVersion(value = "") {
  return value
    .replace(/^v/i, "")
    .replace(/-windows-early-access$/i, "")
    .trim();
}

function compareVersions(left, right) {
  const a = normalizeVersion(left).split(".").map(Number);
  const b = normalizeVersion(right).split(".").map(Number);
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = Number.isFinite(a[index]) ? a[index] : 0;
    const rightPart = Number.isFinite(b[index]) ? b[index] : 0;

    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

function findAsset(release, pattern) {
  return release?.assets?.find((asset) => pattern.test(asset.name)) ?? null;
}

export function DownloadsUpdatePanel() {
  const [status, setStatus] = useState("checking");
  const [release, setRelease] = useState(null);
  const [error, setError] = useState("");

  async function checkForUpdates() {
    setStatus("checking");
    setError("");

    try {
      const response = await fetch(RELEASES_API, {
        headers: {
          Accept: "application/vnd.github+json"
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const releases = await response.json();
      const latest = releases.find(
        (item) => !item.draft && item.tag_name?.includes("windows")
      );

      if (!latest) {
        throw new Error("No Windows release was found");
      }

      setRelease(latest);

      const latestVersion = normalizeVersion(latest.tag_name);
      const comparison = compareVersions(latestVersion, CURRENT_VERSION);

      setStatus(comparison > 0 ? "update-available" : "up-to-date");
    } catch (requestError) {
      setStatus("error");
      setError(requestError.message || "Update check failed");
    }
  }

  useEffect(() => {
    checkForUpdates();
  }, []);

  const assets = useMemo(() => {
    const setup = findAsset(
      release,
      /^UAOS-V1-Setup-.*-x64\.exe$/i
    );

    const portable = findAsset(
      release,
      /^UAOS-V1-Portable-.*-x64\.exe$/i
    );

    const checksums = findAsset(
      release,
      /^SHA256SUMS.*\.txt$/i
    );

    return { setup, portable, checksums };
  }, [release]);

  const latestVersion = release
    ? normalizeVersion(release.tag_name)
    : "Checking...";

  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">UAOS WINDOWS DOWNLOAD CENTER</p>
        <h1>Downloads & Updates</h1>

        <p className="lead">
          Download verified Windows builds directly from the official UAOS
          GitHub Release channel.
        </p>

        <div className="cards three">
          <article className="card">
            <h2>Installed version</h2>
            <strong>{CURRENT_VERSION}</strong>
            <p>Local application version.</p>
          </article>

          <article className="card">
            <h2>Latest release</h2>
            <strong>{latestVersion}</strong>
            <p>
              {release?.prerelease
                ? "Windows Early Access prerelease"
                : "Stable Windows release"}
            </p>
          </article>

          <article className="card">
            <h2>Update status</h2>

            {status === "checking" && <strong>Checking...</strong>}
            {status === "up-to-date" && <strong>Up to date</strong>}
            {status === "update-available" && (
              <strong>Update available</strong>
            )}
            {status === "error" && <strong>Check unavailable</strong>}

            {error && <p>{error}</p>}

            <button
              className="secondary"
              type="button"
              onClick={checkForUpdates}
            >
              Check again
            </button>
          </article>
        </div>

        <div className="cards three">
          <article className="card">
            <h2>Windows Setup</h2>
            <p>Standard installer for Windows x64.</p>

            {assets.setup ? (
              <a
                className="primaryLaunch"
                href={assets.setup.browser_download_url}
                target="_blank"
                rel="noreferrer"
              >
                Download Setup
              </a>
            ) : (
              <p>Setup asset unavailable.</p>
            )}
          </article>

          <article className="card">
            <h2>Portable</h2>
            <p>Run UAOS without installation.</p>

            {assets.portable ? (
              <a
                className="secondaryLaunch"
                href={assets.portable.browser_download_url}
                target="_blank"
                rel="noreferrer"
              >
                Download Portable
              </a>
            ) : (
              <p>Portable asset unavailable.</p>
            )}
          </article>

          <article className="card">
            <h2>SHA256 Checksums</h2>
            <p>Verify downloaded release files.</p>

            {assets.checksums ? (
              <a
                className="secondaryLaunch"
                href={assets.checksums.browser_download_url}
                target="_blank"
                rel="noreferrer"
              >
                Download SHA256
              </a>
            ) : (
              <p>Checksum asset unavailable.</p>
            )}
          </article>
        </div>

        {release && (
          <section className="panelSection">
            <h2>Official release</h2>
            <p>{release.name}</p>
            <p>Published: {new Date(release.published_at).toLocaleString()}</p>

            <a
              className="secondaryLaunch"
              href={release.html_url}
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub Release
            </a>
          </section>
        )}

        <section className="panelSection">
          <h2>Security notice</h2>
          <p>
            Early Access Windows builds are currently unsigned. Windows
            SmartScreen may display a warning until commercial code signing is
            enabled.
          </p>
        </section>
      </section>
    </main>
  );
}
