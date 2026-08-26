import { useEffect, useMemo, useState } from "react";
import "./style.css";

const BRIDGE = "http://127.0.0.1:3407";

const safety = {
  publicLaunch: "BLOCKED",
  deploy: "BLOCKED",
  payment: "DISABLED",
  invoice: "BLOCKED",
  realKorgWriter: "BLOCKED",
  usb: "BLOCKED",
  hardwareLoad: "BLOCKED",
  pa3xClaim: "BLOCKED"
};

function buildArrangement(idea, tempo, scale) {
  return {
    projectName: "UAOS Real Workstation Arrangement",
    createdAt: new Date().toISOString(),
    songIdea: idea,
    tempo,
    keyScale: scale,
    sections: [
      { name: "Intro", bars: 4 },
      { name: "Verse", bars: 8 },
      { name: "Chorus", bars: 8 },
      { name: "Fill", bars: 1 },
      { name: "Ending", bars: 4 }
    ],
    tracks: [
      { name: "Drums", sound: "Oriental Studio Kit" },
      { name: "Bass", sound: "Acoustic Deep Bass" },
      { name: "Chords", sound: "Warm Piano Pad" },
      { name: "Lead", sound: "Kanoun Solo" },
      { name: "Pad", sound: "Strings Ensemble" },
      { name: "Percussion", sound: "Darabuka Fill" }
    ],
    safety
  };
}

function buildCandidate(arrangement) {
  return {
    status: "KORG_CANDIDATE_RESEARCH_ONLY",
    targetFamily: "KORG_ARRANGER_RESEARCH",
    targetModels: ["PA3X", "PA5X"],
    sourceProject: arrangement.projectName,
    tempo: arrangement.tempo,
    keyScale: arrangement.keyScale,
    sections: arrangement.sections,
    tracks: arrangement.tracks,
    blockedOutputs: [".SET", ".STY", ".PCM", ".KMP", ".KSF", "USB", "HardwareLoad"],
    blockedClaims: ["KORG hardware readiness claim blocked", "PA3X claim blocked"],
    safety
  };
}

async function postJson(url, data) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await r.json();
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [idea, setIdea] = useState("Oriental pop arrangement demo");
  const [tempo, setTempo] = useState("100");
  const [scale, setScale] = useState("D minor / Nahawand");
  const [bridge, setBridge] = useState("checking");
  const [log, setLog] = useState("");

  const arrangement = useMemo(() => buildArrangement(idea, tempo, scale), [idea, tempo, scale]);
  const candidate = useMemo(() => buildCandidate(arrangement), [arrangement]);

  useEffect(() => {
    fetch(BRIDGE + "/health")
      .then(r => r.json())
      .then(() => setBridge("online"))
      .catch(() => setBridge("offline"));
  }, []);

  const plan = `UAOS ARRANGEMENT PLAN

Song Idea: ${idea}
Tempo: ${tempo}
Key / Scale: ${scale}

Sections:
${arrangement.sections.map(s => "- " + s.name + ": " + s.bars + " bars").join("\n")}

Tracks:
${arrangement.tracks.map(t => "- " + t.name + ": " + t.sound).join("\n")}

Safety:
Real KORG writer blocked.
USB blocked.
Hardware load blocked.
Public launch blocked.`;

  async function saveArrangement() {
    try {
      const r = await postJson(BRIDGE + "/api/save-arrangement", arrangement);
      setLog("Arrangement saved to disk:\n" + JSON.stringify(r, null, 2));
    } catch (e) {
      setLog("Bridge offline or save failed:\n" + e.message);
    }
  }

  async function saveCandidate() {
    try {
      const r = await postJson(BRIDGE + "/api/save-korg-candidate", candidate);
      setLog("KORG candidate saved to disk:\n" + JSON.stringify(r, null, 2));
    } catch (e) {
      setLog("Bridge offline or save failed:\n" + e.message);
    }
  }

  async function runValidator() {
    try {
      const r = await fetch(BRIDGE + "/api/validate").then(x => x.json());
      setLog("VALIDATOR RESULT:\n" + JSON.stringify(r, null, 2));
      setTab("validator");
    } catch (e) {
      setLog("Validator failed:\n" + e.message);
    }
  }

  async function openOutput() {
    try {
      await postJson(BRIDGE + "/api/open-output", {});
    } catch (e) {
      setLog("Open output failed:\n" + e.message);
    }
  }

  return (
    <div className="uaos">
      <aside>
        <div className="logo">UAOS</div>
        <div className="sub">Real Workstation + Bridge</div>
        {["dashboard", "arrangement", "korg", "validator", "reports"].map(x => (
          <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>
            {x.toUpperCase()}
          </button>
        ))}
        <div className={bridge === "online" ? "bridge online" : "bridge offline"}>
          BRIDGE: {bridge.toUpperCase()}
        </div>
        <div className="locks">
          <div>PUBLIC LAUNCH: BLOCKED</div>
          <div>DEPLOY: BLOCKED</div>
          <div>PAYMENT: DISABLED</div>
          <div>REAL KORG WRITER: BLOCKED</div>
          <div>USB: BLOCKED</div>
          <div>HARDWARE LOAD: BLOCKED</div>
        </div>
      </aside>

      <main>
        {tab === "dashboard" && (
          <>
            <h1>UAOS Real Workstation</h1>
            <p className="ok">Final local owner review · Bridge saves real files to disk</p>
            <div className="cards">
              <section><h2>Program</h2><p>React workstation connected to local bridge.</p></section>
              <section><h2>Works</h2><p>Save arrangement, save KORG candidate, run validator, open output folder.</p></section>
              <section><h2>Blocked</h2><p>No deploy · No USB · No hardware load · No real KORG writer.</p></section>
            </div>
            <div className="actions">
              <button onClick={() => setTab("arrangement")}>Start Working</button>
              <button onClick={saveArrangement}>Save Arrangement To Disk</button>
              <button onClick={saveCandidate}>Save KORG Candidate To Disk</button>
              <button onClick={runValidator}>Run Validator</button>
              <button onClick={openOutput}>Open Output Folder</button>
            </div>
            <pre>{plan}</pre>
          </>
        )}

        {tab === "arrangement" && (
          <>
            <h1>Arrangement Builder</h1>
            <label>Song Idea</label>
            <textarea value={idea} onChange={e => setIdea(e.target.value)} />
            <label>Tempo</label>
            <input value={tempo} onChange={e => setTempo(e.target.value)} />
            <label>Key / Scale</label>
            <input value={scale} onChange={e => setScale(e.target.value)} />
            <div className="actions">
              <button onClick={saveArrangement}>Save UAOS Package To Disk</button>
              <button onClick={saveCandidate}>Generate KORG Candidate To Disk</button>
              <button onClick={openOutput}>Open Output Folder</button>
            </div>
            <pre>{plan}</pre>
          </>
        )}

        {tab === "korg" && (
          <>
            <h1>KORG Candidate Research</h1>
            <p className="warn">Research only. No SET/STY writer. No USB. No hardware load.</p>
            <div className="actions">
              <button onClick={saveCandidate}>Save Candidate To Disk</button>
              <button onClick={runValidator}>Run Validator</button>
            </div>
            <pre>{JSON.stringify(candidate, null, 2)}</pre>
          </>
        )}

        {tab === "validator" && (
          <>
            <h1>Validator</h1>
            <pre>{log || "Click Run Validator."}</pre>
          </>
        )}

        {tab === "reports" && (
          <>
            <h1>Reports / Output</h1>
            <div className="actions">
              <button onClick={openOutput}>Open Output Folder</button>
              <button onClick={runValidator}>Run Validator</button>
            </div>
            <pre>{log || "Reports are written to E:\\keyboard-manager-clean\\uaos-ai-factory\\uaos-real-workstation-output"}</pre>
          </>
        )}
      </main>
    </div>
  );
}
