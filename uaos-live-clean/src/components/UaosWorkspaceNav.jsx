import "./UaosWorkspaceNav.css";

const WORKSPACES = [
  ["Home", ""],
  ["Smart Sequencer", "smart-sequencer"],
  ["Audio", "audio"],
  ["MIDI", "midi"],
  ["Sampler", "sampler"],
  ["Arranger", "arranger"],
  ["Studio", "studio"],
  ["Sounds", "sounds"],
  ["Device Profiles", "device-profiles"],
  ["Music Encyclopedia", "music-encyclopedia"],
  ["Downloads", "downloads"],
  ["Pricing", "pricing"],
  ["Support", "support"],
];

export function UaosWorkspaceNav() {
  const active =
    typeof window === "undefined"
      ? ""
      : window.location.hash
          .replace(/^#\/?/, "")
          .split(/[?&]/)[0]
          .toLowerCase();

  return (
    <nav className="uaos-workspace-nav" aria-label="UAOS workspaces">
      <a href="#/" className="uaos-back-button" onClick={(event) => {
        if (window.history.length > 1 && active) {
          event.preventDefault();
          window.history.back();
        }
      }}>
        Back
      </a>

      <div className="uaos-workspace-links">
        {WORKSPACES.map(([label, route]) => {
          const href = route ? `#/${route}` : "#/";
          const selected = active === route || (!active && !route);

          return (
            <a
              key={label}
              href={href}
              className={selected ? "active" : ""}
            >
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}