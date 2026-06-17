import { useMemo, useState } from "react";

const starterSections = [
{
type: "intro",
startBar: 1,
lengthBars: 4,
energy: 0.25
},
{
type: "verse",
startBar: 5,
lengthBars: 8,
energy: 0.45
},
{
type: "chorus",
startBar: 13,
lengthBars: 8,
energy: 0.85
},
{
type: "outro",
startBar: 21,
lengthBars: 4,
energy: 0.3
}
];

export function AudioArrangementPlannerPanel() {
const [title, setTitle] = useState("New Arrangement");
const [bpm, setBpm] = useState(96);
const [keyName, setKeyName] = useState("C");
const [scale, setScale] = useState("minor");

const [sectionsJson, setSectionsJson] = useState(
JSON.stringify(starterSections, null, 2)
);

const [result, setResult] = useState(null);
const [error, setError] = useState("");

const canSubmit = useMemo(() => {
const value = Number(bpm);
return value >= 20 && value <= 300;
}, [bpm]);

async function createPlan() {
setError("");
setResult(null);

```
try {
  const sections = JSON.parse(sectionsJson);

  const response = await fetch(
    "/api/audio-arrangement/plan",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        bpm: Number(bpm),
        key: keyName,
        scale,
        sourceMode: "manual-metadata",
        targetProfiles: [
          "korg-pa5x",
          "yamaha-genos",
          "roland-bk9",
          "ketron-sd9"
        ],
        sections
      })
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        "Unable to create arrangement plan"
    );
  }

  setResult(payload.data);
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Unable to create arrangement plan"
  );
}
```

}

return ( <section className="uaosPanel"> <h2>Audio-to-Arrangement Planner</h2>

```
  <p>
    Creates a neutral arrangement manifest from verified
    metadata. Stem separation, MIDI draft export, and
    proprietary SET export remain separate stages.
  </p>

  <div className="uaosFormGrid">
    <label>
      <span>Title</span>
      <input
        value={title}
        onChange={(event) =>
          setTitle(event.target.value)
        }
      />
    </label>

    <label>
      <span>BPM</span>
      <input
        type="number"
        min="20"
        max="300"
        value={bpm}
        onChange={(event) =>
          setBpm(event.target.value)
        }
      />
    </label>

    <label>
      <span>Key</span>
      <input
        value={keyName}
        onChange={(event) =>
          setKeyName(event.target.value)
        }
      />
    </label>

    <label>
      <span>Scale</span>
      <select
        value={scale}
        onChange={(event) =>
          setScale(event.target.value)
        }
      >
        <option value="major">Major</option>
        <option value="minor">Minor</option>
        <option value="nahawand">Nahawand</option>
        <option value="hijaz">Hijaz</option>
        <option value="bayati">Bayati</option>
        <option value="rast">Rast</option>
      </select>
    </label>
  </div>

  <label>
    <span>Sections JSON</span>
    <textarea
      rows="14"
      value={sectionsJson}
      onChange={(event) =>
        setSectionsJson(event.target.value)
      }
    />
  </label>

  <button
    type="button"
    disabled={!canSubmit}
    onClick={createPlan}
  >
    Create Neutral Arrangement Plan
  </button>

  {error ? (
    <p role="alert">{error}</p>
  ) : null}

  {result ? (
    <pre>{JSON.stringify(result, null, 2)}</pre>
  ) : null}
</section>
```

);
}
