import { useEffect, useRef, useState } from "react";
import { eventBus } from "../core/eventBus.js";
import { EVENT_TYPES } from "../core/eventTypes.js";
import { createAllNotesOffMessages, formatMidiEvent, parseMidiMessage, transformMidiEvent } from "../midi/midiEngine.js";
import { getMidiNavigator, readMidiMappings, writeMidiMappings } from "../hooks/midiEnvironment.js";

const MAP_KEY = "uaos_v1_midi_mappings";

export function MidiMonitor({ compact = false }) {
  const [status, setStatus] = useState("Not scanned");
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [inputId, setInputId] = useState("");
  const [outputId, setOutputId] = useState("");
  const [events, setEvents] = useState([]);
  const [thru, setThru] = useState(false);
  const [learn, setLearn] = useState("");
  const [mappings, setMappings] = useState(() => readMidiMappings(undefined, MAP_KEY));
  const [transpose, setTranspose] = useState(0);
  const [outputChannel, setOutputChannel] = useState("");
  const accessRef = useRef(null);

  async function scan() {
    if (typeof window !== "undefined" && window.uaosMidi) {
      const test = await window.uaosMidi.test();
      const ins = await window.uaosMidi.listInputs();
      const outs = await window.uaosMidi.listOutputs();
      setInputs(ins.inputs || []);
      setOutputs(outs.outputs || []);
      setStatus(test.message || "Desktop MIDI bridge ready");
      return;
    }
    const midiNavigator = getMidiNavigator();
    if (!midiNavigator) {
      setStatus("Browser unsupported: WebMIDI is unavailable.");
      return;
    }
    try {
      const access = await midiNavigator.requestMIDIAccess({ sysex: false });
      accessRef.current = access;
      access.onstatechange = () => summarize(access);
      summarize(access);
      setStatus("WebMIDI permission granted");
    } catch (error) {
      setStatus(`MIDI permission failed: ${error.message}`);
    }
  }

  function summarize(access) {
    setInputs([...access.inputs.values()].map((input) => ({ id: input.id, name: input.name || "MIDI Input", state: input.state })));
    setOutputs([...access.outputs.values()].map((output) => ({ id: output.id, name: output.name || "MIDI Output", state: output.state })));
  }

  useEffect(() => {
    const access = accessRef.current;
    if (!access) return undefined;
    for (const input of access.inputs.values()) input.onmidimessage = null;
    const selected = access.inputs.get(inputId);
    if (!selected) return undefined;
    selected.onmidimessage = (message) => {
      const event = parseMidiMessage(message.data, message.timeStamp);
      if (learn) {
        const next = { ...mappings, [learn]: { type: event.type, channel: event.channel, data1: event.data1 } };
        setMappings(next);
        writeMidiMappings(undefined, MAP_KEY, next);
        setLearn("");
      }
      setEvents((current) => [{ ...event, label: formatMidiEvent(event) }, ...current].slice(0, 40));
      eventBus.emit(EVENT_TYPES.MIDI_EVENT, event);
      if (thru) sendEvent(event);
    };
    return () => {
      selected.onmidimessage = null;
    };
  }, [inputId, thru, outputId, transpose, outputChannel, learn, mappings]);

  function sendEvent(event) {
    const access = accessRef.current;
    const output = access?.outputs.get(outputId);
    const transformed = transformMidiEvent(event, { transpose: Number(transpose), outputChannel: outputChannel ? Number(outputChannel) : null });
    if (output && transformed?.raw) output.send(transformed.raw);
  }

  function panic() {
    const output = accessRef.current?.outputs.get(outputId);
    createAllNotesOffMessages().forEach((message) => output?.send(message));
    eventBus.emit(EVENT_TYPES.ARRANGER_PANIC, { source: "midi-monitor" });
  }

  return (
    <section className={compact ? "panelSection compact" : "panelSection"}>
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">MIDI Monitor</p>
          <h2>Inputs, events, thru, and learn</h2>
        </div>
        <button onClick={scan}>Scan MIDI</button>
      </div>
      <p>{status}</p>
      <div className="controlRow">
        <select value={inputId} onChange={(event) => setInputId(event.target.value)}>
          <option value="">Input</option>
          {inputs.map((input) => <option key={input.id || input.name} value={input.id}>{input.name} ({input.state || "ready"})</option>)}
        </select>
        <select value={outputId} onChange={(event) => setOutputId(event.target.value)}>
          <option value="">Output</option>
          {outputs.map((output) => <option key={output.id || output.name} value={output.id}>{output.name} ({output.state || "ready"})</option>)}
        </select>
        <label><input type="checkbox" checked={thru} onChange={(event) => setThru(event.target.checked)} /> MIDI thru</label>
        <input type="number" value={transpose} min="-24" max="24" onChange={(event) => setTranspose(event.target.value)} aria-label="Transpose" />
        <select value={outputChannel} onChange={(event) => setOutputChannel(event.target.value)}>
          <option value="">Source channel</option>
          {Array.from({ length: 16 }, (_, index) => <option key={index + 1} value={index + 1}>Out CH {index + 1}</option>)}
        </select>
        <button onClick={panic}>Panic</button>
      </div>
      <div className="controlRow">
        {["transportStart", "transportStop", "variation", "fill"].map((target) => (
          <button key={target} className={learn === target ? "active" : ""} onClick={() => setLearn(target)}>Learn {target}</button>
        ))}
      </div>
      <div className="cards two">
        <article className="card">
          <h3>Events</h3>
          <div className="eventList">{events.map((event, index) => <p key={`${event.timestamp}-${index}`}>{event.label}</p>)}</div>
        </article>
        <article className="card">
          <h3>Mappings</h3>
          {Object.entries(mappings).length ? Object.entries(mappings).map(([key, value]) => <p key={key}>{key}: {value.type} CH{value.channel} {value.data1}</p>) : <p>No mappings learned yet.</p>}
        </article>
      </div>
    </section>
  );
}

