import { useEffect, useRef, useState } from "react";
import { eventBus } from "../core/eventBus.js";
import { EVENT_TYPES } from "../core/eventTypes.js";
import {
  createAllNotesOffMessages,
  formatMidiEvent,
  parseMidiMessage,
  transformMidiEvent
} from "../midi/midiEngine.js";
import {
  getMidiNavigator,
  readMidiMappings,
  writeMidiMappings
} from "../hooks/midiEnvironment.js";

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
  const [mappings, setMappings] = useState(() =>
    readMidiMappings(undefined, MAP_KEY)
  );
  const [transpose, setTranspose] = useState(0);
  const [outputChannel, setOutputChannel] = useState("");
  const accessRef = useRef(null);

  function processMessage(raw, timestamp = performance.now()) {
    const event = parseMidiMessage(raw, timestamp);

    if (learn) {
      const next = {
        ...mappings,
        [learn]: {
          type: event.type,
          channel: event.channel,
          data1: event.data1
        }
      };

      setMappings(next);
      writeMidiMappings(undefined, MAP_KEY, next);
      setLearn("");
    }

    setEvents((current) => [
      {
        ...event,
        label: formatMidiEvent(event)
      },
      ...current
    ].slice(0, 40));

    eventBus.emit(
      EVENT_TYPES.MIDI_EVENT,
      event
    );

    if (thru) {
      sendEvent(event);
    }
  }

  async function scan() {
    setStatus("Scanning MIDI...");

    if (
      typeof window !== "undefined" &&
      window.uaosMidi
    ) {
      try {
        const test = await window.uaosMidi.test();
        const ins = await window.uaosMidi.listInputs();
        const outs = await window.uaosMidi.listOutputs();

        const nextInputs = ins.inputs || [];
        const nextOutputs = outs.outputs || [];

        setInputs(nextInputs);
        setOutputs(nextOutputs);

        if (!inputId && nextInputs.length) {
          setInputId(nextInputs[0].id);
        }

        if (!outputId && nextOutputs.length) {
          setOutputId(nextOutputs[0].id);
        }

        setStatus(
          nextInputs.length
            ? `${test.message || "Desktop MIDI ready"} — ${nextInputs.length} input(s)`
            : ins.error || "No desktop MIDI inputs detected"
        );

        return;
      } catch (error) {
        setStatus(
          `Desktop MIDI scan failed: ${error.message}`
        );
        return;
      }
    }

    const midiNavigator = getMidiNavigator();

    if (!midiNavigator) {
      setStatus(
        "Browser unsupported: WebMIDI is unavailable."
      );
      return;
    }

    try {
      const access =
        await midiNavigator.requestMIDIAccess({
          sysex: false
        });

      accessRef.current = access;
      access.onstatechange = () => summarize(access);

      summarize(access);

      const firstInput =
        [...access.inputs.values()][0];

      if (!inputId && firstInput) {
        setInputId(firstInput.id);
      }

      setStatus(
        `WebMIDI permission granted — ${access.inputs.size} input(s)`
      );
    } catch (error) {
      setStatus(
        `MIDI permission failed: ${error.message}`
      );
    }
  }

  function summarize(access) {
    setInputs(
      [...access.inputs.values()].map((input) => ({
        id: input.id,
        name: input.name || "MIDI Input",
        state: input.state
      }))
    );

    setOutputs(
      [...access.outputs.values()].map((output) => ({
        id: output.id,
        name: output.name || "MIDI Output",
        state: output.state
      }))
    );
  }

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.uaosMidi ||
      !inputId
    ) {
      return undefined;
    }

    let disposed = false;
    let unsubscribe = () => {};

    window.uaosMidi
      .startInput(inputId)
      .then((result) => {
        if (disposed) {
          return;
        }

        if (!result?.ok) {
          setStatus(
            result?.error || "Could not open MIDI input"
          );
          return;
        }

        setStatus(
          `Listening to ${inputId}`
        );
      })
      .catch((error) => {
        if (!disposed) {
          setStatus(
            `MIDI input failed: ${error.message}`
          );
        }
      });

    unsubscribe = window.uaosMidi.onMessage(
      (payload) => {
        if (
          payload?.inputId === inputId &&
          Array.isArray(payload.raw)
        ) {
          processMessage(
            payload.raw,
            payload.receivedAt || performance.now()
          );
        }
      }
    );

    return () => {
      disposed = true;
      unsubscribe?.();
      window.uaosMidi.stopInput().catch(() => {});
    };
  }, [
    inputId,
    thru,
    outputId,
    transpose,
    outputChannel,
    learn,
    mappings
  ]);

  useEffect(() => {
    const access = accessRef.current;

    if (!access || !inputId) {
      return undefined;
    }

    for (const input of access.inputs.values()) {
      input.onmidimessage = null;
    }

    const selected = access.inputs.get(inputId);

    if (!selected) {
      return undefined;
    }

    selected.onmidimessage = (message) => {
      processMessage(
        [...message.data],
        message.timeStamp
      );
    };

    return () => {
      selected.onmidimessage = null;
    };
  }, [
    inputId,
    thru,
    outputId,
    transpose,
    outputChannel,
    learn,
    mappings
  ]);

  function sendEvent(event) {
    const access = accessRef.current;
    const output = access?.outputs.get(outputId);

    const transformed = transformMidiEvent(
      event,
      {
        transpose: Number(transpose),
        outputChannel: outputChannel
          ? Number(outputChannel)
          : null
      }
    );

    if (output && transformed?.raw) {
      output.send(transformed.raw);
    }
  }

  function panic() {
    const output =
      accessRef.current?.outputs.get(outputId);

    createAllNotesOffMessages().forEach(
      (message) => output?.send(message)
    );

    eventBus.emit(
      EVENT_TYPES.ARRANGER_PANIC,
      { source: "midi-monitor" }
    );
  }

  return (
    <section className={
      compact
        ? "panelSection compact"
        : "panelSection"
    }>
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">MIDI Monitor</p>
          <h2>Inputs, events, thru, and learn</h2>
        </div>

        <button onClick={scan}>
          Scan MIDI
        </button>
      </div>

      <p>{status}</p>

      <div className="controlRow">
        <select
          value={inputId}
          onChange={(event) =>
            setInputId(event.target.value)
          }
        >
          <option value="">Input</option>

          {inputs.map((input) => (
            <option
              key={input.id || input.name}
              value={input.id}
            >
              {input.name} ({input.state || "ready"})
            </option>
          ))}
        </select>

        <select
          value={outputId}
          onChange={(event) =>
            setOutputId(event.target.value)
          }
        >
          <option value="">Output</option>

          {outputs.map((output) => (
            <option
              key={output.id || output.name}
              value={output.id}
            >
              {output.name} ({output.state || "ready"})
            </option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            checked={thru}
            onChange={(event) =>
              setThru(event.target.checked)
            }
          />
          MIDI thru
        </label>

        <input
          type="number"
          value={transpose}
          min="-24"
          max="24"
          onChange={(event) =>
            setTranspose(event.target.value)
          }
          aria-label="Transpose"
        />

        <select
          value={outputChannel}
          onChange={(event) =>
            setOutputChannel(event.target.value)
          }
        >
          <option value="">Source channel</option>

          {Array.from(
            { length: 16 },
            (_, index) => (
              <option
                key={index + 1}
                value={index + 1}
              >
                Out CH {index + 1}
              </option>
            )
          )}
        </select>

        <button onClick={panic}>
          Panic
        </button>
      </div>

      <div className="controlRow">
        {[
          "transportStart",
          "transportStop",
          "variation",
          "fill"
        ].map((target) => (
          <button
            key={target}
            className={learn === target ? "active" : ""}
            onClick={() => setLearn(target)}
          >
            Learn {target}
          </button>
        ))}
      </div>

      <div className="cards two">
        <article className="card">
          <h3>Events</h3>

          <div className="eventList">
            {events.map((event, index) => (
              <p key={`${event.timestamp}-${index}`}>
                {event.label}
              </p>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Mappings</h3>

          {Object.entries(mappings).length
            ? Object.entries(mappings).map(
                ([key, value]) => (
                  <p key={key}>
                    {key}: {value.type} CH{value.channel} {value.data1}
                  </p>
                )
              )
            : <p>No mappings learned yet.</p>}
        </article>
      </div>
    </section>
  );
}
