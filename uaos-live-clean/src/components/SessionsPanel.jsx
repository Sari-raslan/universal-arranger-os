import { useState } from "react";
import { clearSession, exportSession, importSession, loadSession, saveSession } from "../session/sessionStore.js";

export function SessionsPanel({ session, onSessionChange }) {
  const [message, setMessage] = useState("");

  function save() {
    const saved = saveSession(session);
    onSessionChange(saved);
    setMessage("Saved locally.");
  }

  function load() {
    const loaded = loadSession();
    onSessionChange(loaded);
    setMessage("Loaded local session.");
  }

  function clear() {
    clearSession();
    setMessage("Local session cleared.");
  }

  function download() {
    const blob = new Blob([exportSession(session)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "uaos-session.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      onSessionChange(importSession(await file.text()));
      setMessage("Imported session.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Sessions</p>
          <h2>Save, load, export, and import</h2>
        </div>
        <span>Project v{session.version}</span>
      </div>
      <input value={session.name} onChange={(event) => onSessionChange({ ...session, name: event.target.value })} />
      <div className="controlRow">
        <button onClick={save}>Save</button>
        <button onClick={load}>Load</button>
        <button onClick={download}>Export JSON</button>
        <label className="buttonLike">Import JSON<input type="file" accept="application/json" onChange={upload} hidden /></label>
        <button onClick={clear}>Clear Local</button>
      </div>
      {message && <p>{message}</p>}
    </section>
  );
}

