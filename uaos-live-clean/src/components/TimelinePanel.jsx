import { useEffect, useRef, useState } from "react";
import { eventBus } from "../core/eventBus.js";
import { EVENT_TYPES } from "../core/eventTypes.js";
import { createTimelineStore } from "../timeline/timelineStore.js";

export function TimelinePanel({ session, onSessionChange }) {
  const storeRef = useRef(createTimelineStore());
  const [state, setState] = useState(storeRef.current.getState());

  useEffect(() => {
    if (session?.timeline?.length) setState(storeRef.current.setEvents(session.timeline));
  }, []);

  useEffect(() => {
    const offMidi = eventBus.on(EVENT_TYPES.MIDI_EVENT, (event) => updateCapture("midi", event.payload));
    const offAudio = eventBus.on(EVENT_TYPES.AUDIO_ANALYSIS, (event) => updateCapture("audio.analysis", event.payload));
    return () => {
      offMidi();
      offAudio();
    };
  }, []);

  function updateCapture(type, payload) {
    const captured = storeRef.current.capture(type, payload);
    if (captured) {
      const next = storeRef.current.getState();
      setState(next);
      onSessionChange?.({ ...session, timeline: next.events });
    }
  }

  function startRecording() {
    setState(storeRef.current.startRecording());
  }

  function stopRecording() {
    const next = storeRef.current.stopRecording();
    setState(next);
    onSessionChange?.({ ...session, timeline: next.events });
  }

  function clear() {
    const next = storeRef.current.clear();
    setState(next);
    onSessionChange?.({ ...session, timeline: [] });
  }

  function playback() {
    const next = storeRef.current.setPlayback(true);
    setState(next);
    eventBus.emit(EVENT_TYPES.TIMELINE_PLAYBACK, { count: next.events.filter((event) => event.type === "midi").length });
    window.setTimeout(() => setState(storeRef.current.setPlayback(false)), Math.max(250, next.events.at(-1)?.time || 250));
  }

  return (
    <section className="panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Throttled MIDI and audio-analysis capture</h2>
        </div>
        <span>{state.events.length} events</span>
      </div>
      <div className="controlRow">
        {!state.recording ? <button onClick={startRecording}>Start Recording</button> : <button onClick={stopRecording}>Stop Recording</button>}
        <button onClick={playback} disabled={!state.events.length || state.recording}>Playback MIDI Info</button>
        <button onClick={clear}>Clear</button>
      </div>
      <div className="eventList tall">
        {state.events.slice(-30).reverse().map((event) => (
          <p key={event.id}>{event.time.toFixed(0)} ms - {event.type}</p>
        ))}
      </div>
    </section>
  );
}

