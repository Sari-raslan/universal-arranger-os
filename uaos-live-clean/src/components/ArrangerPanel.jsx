import { useEffect, useReducer, useRef } from "react";
import { eventBus } from "../core/eventBus.js";
import { EVENT_TYPES } from "../core/eventTypes.js";
import { LANES, SECTIONS, createArrangerState, nextTickMs, reduceArranger } from "../arranger/arrangerEngine.js";
import { createAllNotesOffMessages } from "../midi/midiEngine.js";

export function ArrangerPanel({ session, onSessionChange, live = false }) {
  const [state, dispatch] = useReducer(reduceArranger, session?.arranger || createArrangerState());
  const timerRef = useRef(0);

  useEffect(() => {
    onSessionChange?.({ ...session, bpm: state.bpm, chord: state.chord, arranger: state });
  }, [state]);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    if (!state.running) return undefined;
    timerRef.current = window.setTimeout(() => {
      dispatch({ type: "tick" });
      eventBus.emit(EVENT_TYPES.ARRANGER_TICK, { bar: state.bar, beat: state.beat, section: state.section });
    }, nextTickMs(state.bpm));
    return () => window.clearTimeout(timerRef.current);
  }, [state.running, state.beat, state.bar, state.bpm]);

  function panic() {
    eventBus.emit(EVENT_TYPES.ARRANGER_PANIC, { messages: createAllNotesOffMessages() });
  }

  return (
    <section className={live ? "panelSection live" : "panelSection"}>
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">{live ? "Live Mode" : "Arranger"}</p>
          <h2>{state.section} - Bar {state.bar}.{state.beat}</h2>
        </div>
        <div className="controlRow">
          {!state.running ? <button onClick={() => dispatch({ type: "start" })}>Start</button> : <button onClick={() => dispatch({ type: "stop" })}>Stop</button>}
          <button onClick={panic}>Panic</button>
        </div>
      </div>
      <div className="controlRow">
        <input type="number" min="30" max="260" value={state.bpm} onChange={(event) => dispatch({ type: "bpm", bpm: event.target.value })} />
        <select value={state.chord} onChange={(event) => dispatch({ type: "chord", chord: event.target.value })}>
          {["Cm", "Dm", "G7", "F", "Bb", "Am", "C"].map((chord) => <option key={chord}>{chord}</option>)}
        </select>
      </div>
      <div className="sectionGrid">
        {SECTIONS.map((section) => <button key={section} className={state.section === section ? "active" : ""} onClick={() => dispatch({ type: "section", section })}>{section}</button>)}
      </div>
      <div className="laneGrid">
        {LANES.map((lane) => (
          <article className="track" key={lane}>
            <span>{lane.toUpperCase()} CH{state.channels[lane]}</span>
            <select value={state.patterns[lane]} onChange={(event) => dispatch({ type: "pattern", lane, pattern: event.target.value })}>
              {["basic", "busy", "half-time", "sparse"].map((pattern) => <option key={pattern}>{pattern}</option>)}
            </select>
            <button className={state.muted[lane] ? "active" : ""} onClick={() => dispatch({ type: "mute", lane })}>Mute</button>
            <button className={state.solo[lane] ? "active" : ""} onClick={() => dispatch({ type: "solo", lane })}>Solo</button>
          </article>
        ))}
      </div>
      <div className="controlRow">
        <button onClick={() => dispatch({ type: "saveScene" })}>Save Scene</button>
        {state.scenes.map((scene, index) => <button key={`${scene.name}-${index}`} onClick={() => dispatch({ type: "recallScene", index })}>{scene.name}</button>)}
      </div>
    </section>
  );
}

