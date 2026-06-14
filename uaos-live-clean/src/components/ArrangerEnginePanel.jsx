import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "./StatusBadge.jsx";
import { useWebMidiInput } from "../hooks/useWebMidiInput.js";
import { recognizeChord } from "../arranger/chordRecognizer.js";
import {
  ARRANGER_LANES,
  ARRANGER_SECTIONS,
  buildAccompanimentSnapshot,
  commitPendingSection,
  createDefaultOpenStyle,
  normalizeOpenStyle,
  parseOpenStyle,
  requestSection,
} from "../arranger/openStyleEngine.js";

const sectionLabels = Object.freeze({
  intro1: "Intro 1",
  intro2: "Intro 2",
  variation1: "Variation 1",
  variation2: "Variation 2",
  variation3: "Variation 3",
  variation4: "Variation 4",
  fill1: "Fill 1",
  fill2: "Fill 2",
  break: "Break",
  ending1: "Ending 1",
  ending2: "Ending 2",
});

const chordKeyboard = Object.freeze([
  { note: 48, label: "C3" },
  { note: 52, label: "E3" },
  { note: 55, label: "G3" },
  { note: 58, label: "A#3" },
  { note: 60, label: "C4" },
  { note: 63, label: "D#4" },
  { note: 67, label: "G4" },
]);

export function ArrangerEnginePanel() {
  const heldNotesRef = useRef(new Set());
  const beatRef = useRef(0);
  const eventCounterRef = useRef(0);

  const [style, setStyle] = useState(() => createDefaultOpenStyle());
  const [heldNotes, setHeldNotes] = useState([]);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);
  const [eventLog, setEventLog] = useState([]);
  const [lastEvent, setLastEvent] = useState("Ready");

  const chord = useMemo(
    () => recognizeChord(heldNotes),
    [heldNotes],
  );

  const snapshot = useMemo(
    () => buildAccompanimentSnapshot(style, chord),
    [style, chord],
  );

  const addEvent = useCallback((event) => {
    setEventLog((current) => [
      {
        id: `${performance.now()}-${eventCounterRef.current++}`,
        at: new Date().toISOString(),
        ...event,
      },
      ...current,
    ].slice(0, 120));
  }, []);

  const refreshHeldNotes = useCallback(() => {
    setHeldNotes([...heldNotesRef.current].sort((a, b) => a - b));
  }, []);

  const noteOn = useCallback((note, source = "ui") => {
    heldNotesRef.current.add(Number(note));
    refreshHeldNotes();
    addEvent({
      type: "noteOn",
      note: Number(note),
      source,
    });
  }, [addEvent, refreshHeldNotes]);

  const noteOff = useCallback((note, source = "ui") => {
    heldNotesRef.current.delete(Number(note));
    refreshHeldNotes();
    addEvent({
      type: "noteOff",
      note: Number(note),
      source,
    });
  }, [addEvent, refreshHeldNotes]);

  const handleMidiEvent = useCallback((message) => {
    if (message.type === "noteOn") {
      noteOn(message.note, "midi");
      return;
    }

    if (message.type === "noteOff") {
      noteOff(message.note, "midi");
      return;
    }

    if (
      message.type === "controlChange" &&
      (message.controller === 120 || message.controller === 123)
    ) {
      heldNotesRef.current.clear();
      refreshHeldNotes();
      setLastEvent("MIDI panic cleared chord notes");
    }
  }, [noteOff, noteOn, refreshHeldNotes]);

  const midi = useWebMidiInput({
    onMidiEvent: handleMidiEvent,
  });

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const millisecondsPerBeat = 60000 / style.tempo;
    const timer = window.setInterval(() => {
      beatRef.current = (
        beatRef.current + 1
      ) % style.timeSignature.numerator;

      setBeat(beatRef.current);

      setStyle((current) => {
        if (
          beatRef.current === 0 &&
          current.pendingSection
        ) {
          const next = commitPendingSection(current);

          addEvent({
            type: "sectionCommitted",
            section: next.currentSection,
            source: "transport",
          });

          setLastEvent(
            `Section changed to ${sectionLabels[next.currentSection]}`,
          );

          return next;
        }

        return current;
      });
    }, millisecondsPerBeat);

    return () => window.clearInterval(timer);
  }, [
    addEvent,
    running,
    style.tempo,
    style.timeSignature.numerator,
  ]);

  function chooseSection(sectionName) {
    setStyle((current) => requestSection(current, sectionName));
    setLastEvent(
      `Queued ${sectionLabels[sectionName]} for next bar`,
    );
    addEvent({
      type: "sectionQueued",
      section: sectionName,
      source: "ui",
    });
  }

  function toggleLane(laneName) {
    setStyle((current) => {
      const next = normalizeOpenStyle(current);
      const section = next.sections[next.currentSection];

      return {
        ...next,
        sections: {
          ...next.sections,
          [next.currentSection]: {
            ...section,
            lanes: section.lanes.map((lane) => (
              lane.name === laneName
                ? { ...lane, muted: !lane.muted }
                : lane
            )),
          },
        },
      };
    });
  }

  function changeTempo(value) {
    setStyle((current) => normalizeOpenStyle({
      ...current,
      tempo: Number(value),
    }));
  }

  function exportStyle() {
    const blob = new Blob(
      [JSON.stringify(style, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "uaos-open-style.json";
    anchor.click();

    URL.revokeObjectURL(url);
    setLastEvent("Open style exported");
  }

  async function importStyle(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const imported = parseOpenStyle(await file.text());
      setStyle(imported);
      setLastEvent(`Imported style: ${imported.name}`);
    } catch (error) {
      setLastEvent(error.message);
    } finally {
      event.target.value = "";
    }
  }

  function stopTransport() {
    setRunning(false);
    beatRef.current = 0;
    setBeat(0);
    setLastEvent("Transport stopped");
  }

  return (
    <section className="arrangerEnginePanel panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">UAOS open arranger engine</p>
          <h2>Live Chord and Style Control</h2>
          <p>
            Open internal style format with chord recognition, sections,
            eight accompaniment lanes and bar-boundary transitions.
          </p>
        </div>
        <StatusBadge status="experimental" />
      </div>

      <div className="arrangerEngineStatus">
        <div><span>Chord</span><strong>{chord.name}</strong></div>
        <div><span>Confidence</span><strong>{Math.round(chord.confidence * 100)}%</strong></div>
        <div><span>Section</span><strong>{sectionLabels[style.currentSection]}</strong></div>
        <div><span>Pending</span><strong>{style.pendingSection ? sectionLabels[style.pendingSection] : "None"}</strong></div>
        <div><span>Beat</span><strong>{beat + 1} / {style.timeSignature.numerator}</strong></div>
        <div><span>Tempo</span><strong>{style.tempo} BPM</strong></div>
        <div className="wide"><span>Last event</span><strong>{lastEvent}</strong></div>
      </div>

      <div className="controlRow">
        <button
          onClick={() => setRunning(true)}
          disabled={running}
        >
          Start
        </button>

        <button
          className="secondary"
          onClick={stopTransport}
        >
          Stop
        </button>

        <label>
          Tempo
          <input
            type="number"
            min="30"
            max="300"
            value={style.tempo}
            onChange={(event) => changeTempo(event.target.value)}
          />
        </label>

        <button
          className="secondary"
          onClick={midi.connect}
        >
          Connect MIDI
        </button>

        <button
          className="secondary"
          onClick={midi.disconnect}
        >
          Disconnect MIDI
        </button>

        <button
          className="secondary"
          onClick={exportStyle}
        >
          Export Style
        </button>

        <label className="fileButton secondary">
          Import Style
          <input
            type="file"
            accept=".json"
            onChange={importStyle}
          />
        </label>
      </div>

      {midi.error && <p className="errorText">{midi.error}</p>}

      <section className="arrangerChordInput">
        <h3>Chord input</h3>
        <p>
          Hold multiple notes by pressing the buttons, or connect MIDI.
        </p>

        <div className="chordNoteButtons">
          {chordKeyboard.map(({ note, label }) => {
            const active = heldNotes.includes(note);

            return (
              <button
                key={note}
                className={active ? "active" : "secondary"}
                onClick={() => (
                  active
                    ? noteOff(note, "ui")
                    : noteOn(note, "ui")
                )}
              >
                {label}
              </button>
            );
          })}

          <button
            className="secondary danger"
            onClick={() => {
              heldNotesRef.current.clear();
              refreshHeldNotes();
              setLastEvent("Chord notes cleared");
            }}
          >
            Clear notes
          </button>
        </div>
      </section>

      <section className="arrangerSectionGrid">
        {ARRANGER_SECTIONS.map((sectionName) => (
          <button
            key={sectionName}
            className={
              style.currentSection === sectionName
                ? "active"
                : style.pendingSection === sectionName
                  ? "pending"
                  : "secondary"
            }
            onClick={() => chooseSection(sectionName)}
          >
            {sectionLabels[sectionName]}
          </button>
        ))}
      </section>

      <section className="arrangerLaneGrid">
        {ARRANGER_LANES.map((laneName) => {
          const lane = style.sections[
            style.currentSection
          ].lanes.find((item) => item.name === laneName);

          const snapshotLane = snapshot.lanes.find(
            (item) => item.name === laneName,
          );

          return (
            <article
              key={laneName}
              className={lane?.muted ? "arrangerLane muted" : "arrangerLane"}
            >
              <div>
                <strong>{laneName}</strong>
                <span>{snapshotLane?.eventCount || 0} events</span>
              </div>

              <button
                className="secondary"
                onClick={() => toggleLane(laneName)}
              >
                {lane?.muted ? "Unmute" : "Mute"}
              </button>
            </article>
          );
        })}
      </section>

      <section className="panelSection compact">
        <h3>Accompaniment snapshot</h3>
        <pre className="arrangerSnapshot">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </section>

      <section className="panelSection compact">
        <h3>Recent arranger events</h3>

        {eventLog.length === 0 ? (
          <p className="emptyState">No arranger event yet.</p>
        ) : (
          <div className="eventList">
            {eventLog.slice(0, 30).map((event) => (
              <p key={event.id}>
                {event.at} آ· {event.type}
                {event.section ? ` آ· ${sectionLabels[event.section]}` : ""}
                {event.note != null ? ` آ· note ${event.note}` : ""}
              </p>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}