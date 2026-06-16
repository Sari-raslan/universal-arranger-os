import { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge.jsx";
import {
  LICENSE_STATES,
  validateManifest,
} from "../library/libraryManifest.js";
import { LIBRARY_CATEGORIES, createLibraryItem } from "../library/libraryCatalog.js";

const starterCatalog = [
  createLibraryItem({
    libraryId: "uaos-oud-demo",
    name: "UAOS Oud Demo",
    vendor: "UAOS",
    licenseStatus: "original-uaos",
    sourceType: "sample",
    instrumentFamily: "oud",
    articulation: "sustain",
    rootNote: 60,
    keyRange: { low: 36, high: 84 },
    velocityRange: { low: 1, high: 127 },
    tags: ["oriental", "plucked", "demo"],
    category: "Oriental",
    filePath: "original/oud/demo-c4.wav",
    status: "metadata-only",
  }),
  createLibraryItem({
    libraryId: "uaos-ney-demo",
    name: "UAOS Ney Demo",
    vendor: "UAOS",
    licenseStatus: "original-uaos",
    sourceType: "sample",
    instrumentFamily: "ney",
    articulation: "sustain",
    rootNote: 67,
    keyRange: { low: 48, high: 88 },
    velocityRange: { low: 1, high: 127 },
    tags: ["oriental", "wind", "demo"],
    category: "Oriental",
    filePath: "original/ney/demo-g4.wav",
    status: "metadata-only",
  }),
];

function reportEntriesToCatalog(report) {
  if (!report || !Array.isArray(report.entries)) {
    throw new Error("The selected file is not a UAOS library scan report.");
  }

  return report.entries.map((entry, index) =>
    createLibraryItem({
      libraryId: `scan-${entry.sha256?.slice(0, 12) || index}`,
      name: entry.relativePath?.split("/").pop() || `Asset ${index + 1}`,
      vendor: "User library",
      licenseStatus: "license-review-required",
      sourceType:
        entry.extension === ".mid" || entry.extension === ".midi"
          ? "midi"
          : "sample",
      instrumentFamily: "unclassified",
      articulation: "unknown",
      keyRange: { low: 0, high: 127 },
      velocityRange: { low: 1, high: 127 },
      tags: [entry.extension?.replace(".", "") || "asset", "scan-import"],
      category: "Western",
      fileHash: entry.sha256 || null,
      filePath: entry.relativePath || `asset-${index + 1}`,
      status: "review-required",
    }),
  );
}

export function LibraryBrowser() {
  const [catalog, setCatalog] = useState(starterCatalog);
  const [query, setQuery] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState("Starter metadata loaded. No commercial samples are bundled.");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalog.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          item.name,
          item.vendor,
          item.instrumentFamily,
          item.articulation,
          ...item.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesLicense =
        licenseFilter === "all" || item.licenseStatus === licenseFilter;
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchesQuery && matchesLicense && matchesCategory;
    });
  }, [catalog, categoryFilter, licenseFilter, query]);

  async function importScanReport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const report = JSON.parse(await file.text());
      const imported = reportEntriesToCatalog(report);
      setCatalog(imported);
      setMessage(`Imported ${imported.length} scanned assets. License review is required before release.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      event.target.value = "";
    }
  }

  function exportCatalog() {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      items: catalog,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "uaos-library-catalog.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="libraryBrowser">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Internal library catalog</p>
          <h1>Sounds & Libraries</h1>
          <p className="lead">
            Browse open UAOS manifests, import a scanner report, review licenses,
            and prepare assets for the sampler.
          </p>
        </div>
        <StatusBadge status="experimental" />
      </div>

      <div className="controlRow">
        <input
          aria-label="Search libraries"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search instrument, tag, articulation..."
        />
        <select
          aria-label="Filter by license"
          value={licenseFilter}
          onChange={(event) => setLicenseFilter(event.target.value)}
        >
          <option value="all">All license states</option>
          {LICENSE_STATES.map((state) => (
            <option value={state} key={state}>{state}</option>
          ))}
        </select>
        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="all">All categories</option>
          {LIBRARY_CATEGORIES.map((category) => (
            <option value={category} key={category}>{category}</option>
          ))}
        </select>
        <label className="buttonLike secondary">
          Import scan report
          <input
            className="visuallyHidden"
            type="file"
            accept="application/json,.json"
            onChange={importScanReport}
          />
        </label>
        <button className="secondary" type="button" onClick={exportCatalog}>
          Export catalog
        </button>
      </div>

      <p className="libraryMessage">{message}</p>

      <div className="libraryStats">
        <span>{catalog.length} total</span>
        <span>{filtered.length} visible</span>
        <span>{catalog.filter((item) => item.licenseStatus === "original-uaos").length} original UAOS</span>
        <span>{catalog.filter((item) => item.licenseStatus === "license-review-required").length} need review</span>
      </div>

      <div className="cards">
        {filtered.map((item) => {
          const errors = validateManifest(item);

          return (
            <article className="card libraryCard" key={item.libraryId}>
              <StatusBadge status={errors.length ? "planned" : "available"} />
              <h2>{item.name}</h2>
              <p>{item.vendor} | {item.instrumentFamily} | {item.articulation}</p>
              <dl className="libraryDetails">
                <div><dt>License</dt><dd>{item.licenseStatus}</dd></div>
                <div><dt>Key range</dt><dd>{item.keyRange.low}-{item.keyRange.high}</dd></div>
                <div><dt>Velocity</dt><dd>{item.velocityRange.low}-{item.velocityRange.high}</dd></div>
                <div><dt>Status</dt><dd>{item.status}</dd></div>
              </dl>
              <div className="tagRow">
                {item.tags.map((tag) => <span className="tagPill" key={tag}>{tag}</span>)}
              </div>
              <small>{item.filePath}</small>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="emptyState">No library item matches the current filters.</p>
      )}
    </section>
  );
}
