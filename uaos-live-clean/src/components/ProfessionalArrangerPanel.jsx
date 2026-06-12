import { useReducer, useState } from "react";
import { createProArrangerState, activeLanes, reduceProArranger, V2_SECTIONS } from "../arranger/proArranger.js";
import { createPattern, createPatternEditor } from "../pattern/patternEditor.js";
import { recognizeChord } from "../chords/chordRecognition.js";
import { DEVICE_PROFILES } from "../devices/deviceProfiles.js";
import { StatusBadge } from "./StatusBadge.jsx";

export function ProfessionalArrangerPanel() {
  const [state, dispatch] = useReducer(reduceProArranger, createProArrangerState());
  const [editor] = useState(() => createPatternEditor(createPattern("v2-pattern")));
  const [pattern, setPattern] = useState(editor.get());
  const chord = recognizeChord([48, 52, 55], { splitPoint: state.splitPoint });

  function addNote() {
    setPattern(editor.addNote({ lane: "drums", tick: pattern.notes.length * 120, note: 36, duration: 120 }));
  }

  return (
    <section className="panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">V2 Professional Arranger <StatusBadge status="experimental" /></p>
          <h2>{state.section} - {activeLanes(state).length} active lanes</h2>
        </div>
      </div>
      <div className="sectionGrid">
        {V2_SECTIONS.map((section) => <button key={section} className={state.section === section ? "active" : ""} onClick={() => dispatch({ type: "requestSection", section })}>{section}</button>)}
      </div>
      {state.pendingSection && <button onClick={() => dispatch({ type: "commitBoundary", boundary: "bar" })}>Commit {state.pendingSection} at Bar</button>}
      <div className="cards two">
        <article className="card">
          <h3>Pattern Editor</h3>
          <p>{pattern.notes.length} notes, loop {pattern.loop ? `${pattern.loop.startTick}-${pattern.loop.endTick}` : "off"}</p>
          <div className="controlRow">
            <button onClick={addNote}>Add Step</button>
            <button onClick={() => setPattern(editor.undo())}>Undo</button>
            <button onClick={() => setPattern(editor.redo())}>Redo</button>
          </div>
        </article>
        <article className="card">
          <h3>Chord Intelligence</h3>
          <p>{chord.symbol} confidence {Math.round(chord.confidence * 100)}%</p>
          <p>Mode: {state.chordMode}</p>
        </article>
      </div>
      <div className="cards">
        {DEVICE_PROFILES.map((profile) => (
          <article className="card" key={profile.id}>
            <StatusBadge status={profile.verified ? "available" : "planned"} />
            <h3>{profile.name}</h3>
            <p>{profile.verified ? "Verified generic profile." : "Unverified mapping template."}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
