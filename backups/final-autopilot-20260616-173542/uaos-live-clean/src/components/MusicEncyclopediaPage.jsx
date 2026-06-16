import { useMemo, useState } from "react";
import "../styles/music-encyclopedia.css";

const INITIAL_ITEMS = [
  {
    id: "oriental-strings-foundation",
    title: "Oriental Strings Foundation",
    description: "Arabic and Eastern string articulation research foundation.",
    category: "uaos-original",
    tier: "signature",
    status: "draft",
    compatibility: ["UAOS UMS"],
    rightsApproved: false,
  },
  {
    id: "arabic-violin-expression",
    title: "Arabic Violin Expression",
    description: "Manual catalog foundation for Arabic violin articulations and expression.",
    category: "uaos-original",
    tier: "pro",
    status: "draft",
    compatibility: ["Smart Sequencer", "Sampler"],
    rightsApproved: false,
  },
  {
    id: "private-user-projects",
    title: "Private User Projects",
    description: "Projects created privately by the user. Not published or used for training.",
    category: "user-private-project",
    tier: "essential",
    status: "private",
    compatibility: ["UAOS UMS"],
    rightsApproved: false,
  },
];

const STATUS_LABELS = {
  draft: "Partial",
  private: "Working — private only",
  approved: "Working",
};

export function MusicEncyclopediaPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return INITIAL_ITEMS.filter((item) => {
      const matchesQuery =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized);

      const matchesCategory =
        category === "all" || item.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <main className="page music-encyclopedia-page">
      <section className="panel encyclopedia-hero">
        <div>
          <p className="eyebrow">UAOS Knowledge and Content Catalog</p>
          <h1>Music Encyclopedia</h1>
          <p>
            Catalog foundation for instruments, articulations, styles,
            compatibility, provenance, and rights status.
          </p>
        </div>

        <a className="encyclopedia-home" href="#/">
          Home
        </a>
      </section>

      <section className="panel encyclopedia-truth">
        <strong>Current state:</strong>
        <span>Catalog browsing and filtering are working.</span>
        <span>Commercial publishing and licensed content ingestion are unavailable.</span>
        <span>User-private projects remain excluded from training.</span>
      </section>

      <section className="panel encyclopedia-controls">
        <label>
          Search catalog
          <input
            type="search"
            value={query}
            placeholder="Violin, maqam, strings, style..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All</option>
            <option value="uaos-original">UAOS Original</option>
            <option value="licensed-song-program">Licensed</option>
            <option value="public-domain-traditional">Public Domain</option>
            <option value="user-private-project">Private Projects</option>
          </select>
        </label>
      </section>

      <section className="encyclopedia-grid">
        {items.length === 0 ? (
          <article className="panel encyclopedia-empty">
            No matching catalog entries.
          </article>
        ) : (
          items.map((item) => (
            <article className="panel encyclopedia-card" key={item.id}>
              <div className="encyclopedia-card-heading">
                <div>
                  <p className="eyebrow">{item.category}</p>
                  <h2>{item.title}</h2>
                </div>

                <span className={`encyclopedia-status status-${item.status}`}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
              </div>

              <p>{item.description}</p>

              <dl>
                <div>
                  <dt>Tier</dt>
                  <dd>{item.tier}</dd>
                </div>

                <div>
                  <dt>Rights</dt>
                  <dd>
                    {item.rightsApproved
                      ? "Approved"
                      : "Not approved for publishing"}
                  </dd>
                </div>

                <div>
                  <dt>Compatibility</dt>
                  <dd>{item.compatibility.join(", ")}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </section>

      <section className="panel encyclopedia-gates">
        <h2>Release gates</h2>

        <div className="encyclopedia-gate-grid">
          <div>
            <strong>Catalog UI</strong>
            <span>working</span>
          </div>

          <div>
            <strong>Rights validation</strong>
            <span>partial</span>
          </div>

          <div>
            <strong>Licensed products</strong>
            <span>unavailable</span>
          </div>

          <div>
            <strong>Audio demonstrations</strong>
            <span>unavailable</span>
          </div>

          <div>
            <strong>Hardware compatibility validation</strong>
            <span>requires hardware validation</span>
          </div>
        </div>
      </section>
    </main>
  );
}