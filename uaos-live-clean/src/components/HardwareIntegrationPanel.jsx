import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEVICE_PROFILES,
  HARDWARE_CONFIG_STORAGE_KEY,
  SETUP_WIZARD_STEPS,
  advanceSetupWizard,
  createHardwareState,
  createManualValidationChecklist,
  discoverMidiDevices,
  exportDiagnosticReport,
  importMappings,
  migrateHardwareSession,
  receiveMidiLearnControl,
  recordDiagnosticEvent,
  routeHardwareMessage,
  saveMidiMapping,
  serializeMappings,
  startMidiLearn,
  validateSysexMessage,
} from "../hardware/hardwarePhase6.js";
import {
  runExternalClockTransport,
  stopExternalClockTransport,
} from "../hardware/safeMidiTransport.js";

function statusText(value) {
  return String(value || "unknown").replaceAll("-", " ");
}

export function HardwareIntegrationPanel({ session, onSessionChange }) {
  const initialHardware = useMemo(() => migrateHardwareSession(session?.hardware), [session?.hardware]);
  const [hardware, setHardware] = useState(initialHardware);
  const [learn, setLearn] = useState(null);
  const [selectedCommand, setSelectedCommand] = useState("transport.start");
  const [importText, setImportText] = useState("");
  const [lastReport, setLastReport] = useState(null);
  const [sendState, setSendState] = useState("idle");
  const [clockBpm, setClockBpm] = useState(100);
  const [clockBars, setClockBars] = useState(1);
  const [clockState, setClockState] = useState("idle");
  const clockAbortRef = useRef(null);
  const midiAccessRef = useRef(null);
  const selectedProfile = DEVICE_PROFILES.find((profile) => profile.id === hardware.selectedProfileId) || DEVICE_PROFILES[0];
  const manualChecklist = createManualValidationChecklist(selectedProfile);

  function commitHardware(next) {
    setHardware(next);
    onSessionChange?.({ ...session, hardware: next });
  }

  async function scan(mock = false) {
    let access = null;

    if (!mock && navigator.requestMIDIAccess) {
      try {
        access = await navigator.requestMIDIAccess({ sysex: false });
        midiAccessRef.current = access;
      } catch {
        midiAccessRef.current = null;
      }
    } else if (mock) {
      midiAccessRef.current = null;
    }

    const result = await discoverMidiDevices({ window, navigator, mock });
    commitHardware({
      ...hardware,
      supported: result.supported,
      permissionState: result.permissionState,
      electronBridgeState: result.electronBridgeState,
      inputs: result.inputs,
      outputs: result.outputs,
      capabilities: {
        webMidi: result.electronBridgeState === "browser",
        electronBridge: result.electronBridgeState === "available",
        mockMode: mock,
      },
      connectionState: result.inputs.length || result.outputs.length ? "available" : "disconnected",
      diagnostic: result.events.reduce((state, event) => recordDiagnosticEvent(state, event), hardware.diagnostic),
    });
  }

  function chooseInput(id) {
    commitHardware({ ...hardware, selectedInputId: id || null, connectionState: id ? "input-selected" : hardware.connectionState });
  }

  function chooseOutput(id) {
    commitHardware({ ...hardware, selectedOutputId: id || null, connectionState: id ? "output-selected" : hardware.connectionState });
  }

  function simulateMessage(bytes) {
    try {
      const routed = routeHardwareMessage(bytes, { mappings: hardware.mappings, profileId: hardware.selectedProfileId });
      const diagnostic = recordDiagnosticEvent(hardware.diagnostic, {
        type: routed.ok ? "midi" : "dropped",
        message: `${routed.command} ${routed.message.type}`,
        channel: routed.message.channel == null ? "system" : routed.message.channel + 1,
        note: routed.message.note,
        velocity: routed.message.velocity,
        cc: routed.message.controller,
        value: routed.message.value,
        program: routed.message.program,
      });
      commitHardware({ ...hardware, diagnostic });
    } catch (error) {
      commitHardware({ ...hardware, diagnostic: recordDiagnosticEvent(hardware.diagnostic, { type: "invalid", message: error.message }) });
    }
  }

  function sendToSelectedOutput(bytes, label = "MIDI message") {
    if (hardware.capabilities.mockMode) {
      simulateMessage(bytes);
      setSendState(`Demo routed: ${label}`);
      return;
    }

    const output = midiAccessRef.current?.outputs?.get(hardware.selectedOutputId);

    if (!output) {
      setSendState("No physical MIDI output is selected or available.");
      commitHardware({
        ...hardware,
        diagnostic: recordDiagnosticEvent(hardware.diagnostic, {
          type: "send-blocked",
          message: `${label}: no physical MIDI output`
        })
      });
      return;
    }

    try {
      output.send(bytes);
      setSendState(`Sent to ${output.name || "MIDI output"}: ${label}`);
      commitHardware({
        ...hardware,
        connectionState: "message-sent",
        diagnostic: recordDiagnosticEvent(hardware.diagnostic, {
          type: "midi-send",
          message: `${label} -> ${output.name || hardware.selectedOutputId}`,
          bytes: [...bytes]
        })
      });
    } catch (error) {
      setSendState(`MIDI send failed: ${error.message}`);
      commitHardware({
        ...hardware,
        diagnostic: recordDiagnosticEvent(hardware.diagnostic, {
          type: "send-error",
          message: error.message
        })
      });
    }
  }

  function sendPanic() {
    if (hardware.capabilities.mockMode) {
      simulateMessage([0xb0, 123, 0]);
      setSendState("Demo panic routed.");
      return;
    }

    const output = midiAccessRef.current?.outputs?.get(hardware.selectedOutputId);

    if (!output) {
      setSendState("Panic blocked: select a physical MIDI output first.");
      return;
    }

    try {
      for (let channel = 0; channel < 16; channel += 1) {
        output.send([0xb0 | channel, 123, 0]);
        output.send([0xb0 | channel, 120, 0]);
        output.send([0xb0 | channel, 121, 0]);
      }
      setSendState(`Panic sent to ${output.name || "MIDI output"}`);
      commitHardware({
        ...hardware,
        diagnostic: recordDiagnosticEvent(hardware.diagnostic, {
          type: "panic-send",
          message: "All Sound Off, Reset Controllers, and All Notes Off sent on 16 channels"
        })
      });
    } catch (error) {
      setSendState(`Panic failed: ${error.message}`);
    }
  }
  async function runClockTransport() {
    if (hardware.capabilities.mockMode) {
      setClockState("Demo mode does not send physical clock.");
      return;
    }

    const output = midiAccessRef.current?.outputs?.get(hardware.selectedOutputId);
    if (!output) {
      setClockState("Select a physical MIDI output first.");
      return;
    }

    const confirmed = window.confirm(
      `Send safe external clock to ${output.name || "selected output"} at ${clockBpm} BPM for ${clockBars} bar(s)? ` +
      "Set PA3X Clock Source to USB/External. No notes, Program Change, SysEx, or Bulk data will be sent."
    );

    if (!confirmed) {
      setClockState("Clock test cancelled.");
      return;
    }

    clockAbortRef.current?.abort();
    const controller = new AbortController();
    clockAbortRef.current = controller;
    setClockState("Running external clock...");

    try {
      const result = await runExternalClockTransport(output, {
        bpm: clockBpm,
        bars: clockBars,
        signal: controller.signal,
        onProgress(event) {
          if (event.type === "clock") {
            setClockState(`Clock ${event.index}/${event.total}`);
          }
        },
      });

      setClockState(
        `Completed ${result.plan.bars} bar(s) at ${result.plan.bpm} BPM and stopped safely.`
      );
      commitHardware({
        ...hardware,
        connectionState: "clock-test-complete",
        diagnostic: recordDiagnosticEvent(hardware.diagnostic, {
          type: "clock-send",
          message: `External clock ${result.plan.bpm} BPM, ${result.plan.pulseCount} pulses, safe stop`,
        }),
      });
    } catch (error) {
      const cancelled = error?.name === "AbortError";
      setClockState(cancelled ? "Clock stopped safely." : `Clock test failed: ${error.message}`);
      commitHardware({
        ...hardware,
        diagnostic: recordDiagnosticEvent(hardware.diagnostic, {
          type: cancelled ? "clock-cancel" : "clock-error",
          message: cancelled ? "External clock cancelled with STOP and panic" : error.message,
        }),
      });
    } finally {
      stopExternalClockTransport(output);
      if (clockAbortRef.current === controller) clockAbortRef.current = null;
    }
  }

  function cancelClockTransport() {
    clockAbortRef.current?.abort();
    const output = midiAccessRef.current?.outputs?.get(hardware.selectedOutputId);
    stopExternalClockTransport(output);
    setClockState("Clock stopped and panic sent.");
  }

  useEffect(() => {
    return () => {
      clockAbortRef.current?.abort();
      const output = midiAccessRef.current?.outputs?.get(hardware.selectedOutputId);
      stopExternalClockTransport(output);
    };
  }, [hardware.selectedOutputId]);

  useEffect(() => {
    return () => {
      const access = midiAccessRef.current;
      if (access) {
        access.onstatechange = null;
        for (const input of access.inputs.values()) {
          input.onmidimessage = null;
        }
      }
      midiAccessRef.current = null;
    };
  }, []);

  function learnFrom(bytes) {
    const nextLearn = learn || startMidiLearn(selectedCommand, { profileId: hardware.selectedProfileId, startedAt: 1, channelFilter: "all" });
    const result = receiveMidiLearnControl(nextLearn, bytes, hardware.mappings, { now: 2 });
    if (result.mapping) {
      commitHardware({
        ...hardware,
        mappings: saveMidiMapping(hardware.mappings, result.mapping),
        diagnostic: recordDiagnosticEvent(hardware.diagnostic, { type: "midi-learn", message: `${result.mapping.command} learned ${result.warning || "ok"}` }),
      });
      setLearn(null);
    } else {
      setLearn(nextLearn);
    }
  }

  function saveConfiguration() {
    const text = JSON.stringify(hardware, null, 2);
    localStorage.setItem(HARDWARE_CONFIG_STORAGE_KEY, text);
    commitHardware({ ...hardware, setupWizard: { ...hardware.setupWizard, saved: true } });
  }

  function importMappingJson() {
    try {
      const mappings = importMappings(importText);
      commitHardware({ ...hardware, mappings, diagnostic: recordDiagnosticEvent(hardware.diagnostic, { type: "import", message: `${mappings.length} mappings imported` }) });
      setImportText("");
    } catch (error) {
      commitHardware({ ...hardware, diagnostic: recordDiagnosticEvent(hardware.diagnostic, { type: "invalid", message: error.message }) });
    }
  }

  function exportReport() {
    const report = exportDiagnosticReport(hardware.diagnostic, hardware);
    setLastReport(report);
  }

  function testSysex() {
    const result = validateSysexMessage([0xf0, selectedProfile.sysex.manufacturerId?.[0] || 0x7d, 0x01, 0xf7], hardware.sysexConsent, selectedProfile);
    commitHardware({ ...hardware, diagnostic: recordDiagnosticEvent(hardware.diagnostic, { type: result.ok ? "sysex-dry-run" : "sysex-blocked", message: result.reason || result.preview }) });
  }

  const ledItems = [
    hardware.selectedInputId,
    hardware.selectedOutputId,
    hardware.mappings.length,
    hardware.permissionState === "granted",
    hardware.diagnostic.clock.running,
    hardware.capabilities.mockMode,
  ];

  return (
    <section className="hardwarePanel">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Hardware Integration</p>
          <h1>Device Control Workstation</h1>
          <p className="lead">Web MIDI, Electron bridge status, MIDI Learn, routing, diagnostics, and setup checks. Demo mode uses deterministic mock devices and does not claim a physical connection.</p>
        </div>
        <button
          className="dangerButton"
          onClick={sendPanic}
          disabled={!hardware.capabilities.mockMode && !hardware.selectedOutputId}
          title={hardware.capabilities.mockMode ? "Run deterministic demo panic" : "Send physical MIDI panic to selected output"}
        >
          Panic
        </button>
      </div>

      <div className="hardwareLedStrip" aria-label="MIDI activity LEDs">
        {ledItems.map((on, index) => <span key={index} className={on ? "on" : ""} />)}
      </div>

      <div className="controlRow">
        <button onClick={() => scan(false)}>Scan MIDI</button>
        <button className="secondary" onClick={() => scan(true)}>Demo Mock</button>
        <button className="secondary" onClick={saveConfiguration}>Save</button>
        <button className="secondary" onClick={() => commitHardware(createHardwareState())}>Clear Local State</button>
      </div>

      <div className="hardwareGrid">
        <article className="card">
          <h2>Devices</h2>
          <p>Permission: {statusText(hardware.permissionState)}</p>
          <p>Electron bridge: {statusText(hardware.electronBridgeState)}</p>
          <label>
            Input
            <select value={hardware.selectedInputId || ""} onChange={(event) => chooseInput(event.target.value)}>
              <option value="">No input selected</option>
              {hardware.inputs.map((device) => <option key={device.id} value={device.id}>{device.name} ({device.state})</option>)}
            </select>
          </label>
          <label>
            Output
            <select value={hardware.selectedOutputId || ""} onChange={(event) => chooseOutput(event.target.value)}>
              <option value="">No output selected</option>
              {hardware.outputs.map((device) => <option key={device.id} value={device.id}>{device.name} ({device.state})</option>)}
            </select>
          </label>
          <button className="secondary" onClick={() => scan(hardware.capabilities.mockMode)}>Reconnect</button>
          {sendState !== "idle" ? <p role="status">{sendState}</p> : null}
        </article>

        <article className="card">
          <h2>Profile</h2>
          <select value={hardware.selectedProfileId} onChange={(event) => commitHardware({ ...hardware, selectedProfileId: event.target.value })}>
            {DEVICE_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.manufacturer} {profile.model}</option>)}
          </select>
          <p>{selectedProfile.notes}</p>
          <span className="statusBadge experimental">{statusText(selectedProfile.verificationStatus)}</span>
          <div className="miniGrid">
            <label>Input CH<input type="number" min="1" max="16" value={hardware.channelConfig.input} onChange={(event) => commitHardware({ ...hardware, channelConfig: { ...hardware.channelConfig, input: Number(event.target.value) } })} /></label>
            <label>Output CH<input type="number" min="1" max="16" value={hardware.channelConfig.output} onChange={(event) => commitHardware({ ...hardware, channelConfig: { ...hardware.channelConfig, output: Number(event.target.value) } })} /></label>
            <label>Drum CH<input type="number" min="1" max="16" value={hardware.channelConfig.drum} onChange={(event) => commitHardware({ ...hardware, channelConfig: { ...hardware.channelConfig, drum: Number(event.target.value) } })} /></label>
          </div>
        </article>

        <article className="card">
          <h2>Transport and Arranger</h2>
          <div className="hardwareButtonGrid">
            {[
              ["Start", [0xfa]],
              ["Stop", [0xfc]],
              ["Var 1", [0xb0, 80, 127]],
              ["Fill 1", [0xb0, 82, 127]],
              ["Sustain", [0xb0, 64, 127]],
              ["Program", [0xc0, 10]],
            ].map(([label, bytes]) => (
              <button
                key={label}
                className="secondary"
                onClick={() => sendToSelectedOutput(bytes, label)}
                disabled={!hardware.capabilities.mockMode && !hardware.selectedOutputId}
              >
                {label}
              </button>
            ))}
          </div>
          <hr />
          <h3>Safe External Clock</h3>
          <p>
            Validated with KORG PA3X over USB. Sends STOP, START, 24 PPQN clock,
            STOP, then panic. No notes, Program Change, SysEx, or Bulk data.
          </p>
          <div className="miniGrid">
            <label>
              BPM
              <input
                type="number"
                min="40"
                max="240"
                value={clockBpm}
                onChange={(event) => setClockBpm(Number(event.target.value))}
              />
            </label>
            <label>
              Bars
              <input
                type="number"
                min="1"
                max="8"
                value={clockBars}
                onChange={(event) => setClockBars(Number(event.target.value))}
              />
            </label>
          </div>
          <div className="controlRow">
            <button
              type="button"
              onClick={runClockTransport}
              disabled={
                clockState.startsWith("Running") ||
                (!hardware.capabilities.mockMode && !hardware.selectedOutputId)
              }
            >
              Run Clock
            </button>
            <button type="button" className="dangerButton" onClick={cancelClockTransport}>
              Stop + Panic
            </button>
          </div>
          <p role="status">{clockState}</p>
        </article>

        <article className="card">
          <h2>MIDI Learn</h2>
          <select value={selectedCommand} onChange={(event) => setSelectedCommand(event.target.value)}>
            {["transport.start", "transport.stop", "variation.1", "fill.1", "panic", "sampler.preset", "mixer.volume", "ai.analyze.metadata"].map((command) => <option key={command}>{command}</option>)}
          </select>
          <div className="controlRow">
            <button onClick={() => setLearn(startMidiLearn(selectedCommand, { profileId: hardware.selectedProfileId, startedAt: 1 }))}>{learn?.active ? "Waiting" : "Start Learn"}</button>
            <button className="secondary" onClick={() => learnFrom([0xb0, 21, 127])}>Receive CC21</button>
            <button className="secondary" onClick={() => setLearn(null)}>Cancel</button>
          </div>
          <div className="eventList">
            {hardware.mappings.map((mapping) => <p key={mapping.id}>{mapping.command}: {mapping.type} CH {mapping.channel == null ? "system" : mapping.channel + 1} {mapping.data1}</p>)}
          </div>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste mapping JSON" />
          <div className="controlRow">
            <button className="secondary" onClick={() => setImportText(serializeMappings(hardware.mappings))}>Export mappings</button>
            <button className="secondary" onClick={importMappingJson}>Import mappings</button>
          </div>
        </article>

        <article className="card">
          <h2>SysEx Safety</h2>
          <p>SysEx enabled: false by default</p>
          <p>Dry-run: {hardware.sysexConsent.dryRun ? "on" : "off"}</p>
          <p>Whitelist required for real sends. Firmware, factory reset, destructive memory writes, and undocumented packets are blocked.</p>
          <button className="secondary" onClick={testSysex}>Dry-run SysEx check</button>
        </article>

        <article className="card">
          <h2>Setup Wizard</h2>
          <p>Step: {statusText(hardware.setupWizard.currentStep)}</p>
          <progress max={SETUP_WIZARD_STEPS.length} value={hardware.setupWizard.completed.length} />
          <div className="controlRow">
            <button onClick={() => commitHardware({ ...hardware, setupWizard: advanceSetupWizard(hardware.setupWizard, { ok: true, demoMode: hardware.capabilities.mockMode }) })}>Next</button>
            <button className="secondary" onClick={() => commitHardware({ ...hardware, setupWizard: { ...hardware.setupWizard, demoMode: true } })}>Demo mode</button>
          </div>
        </article>

        <article className="card wide">
          <h2>Diagnostics</h2>
          <p>{hardware.diagnostic.privacyNotice}</p>
          <div className="miniGrid">
            <b>Dropped {hardware.diagnostic.droppedMessages}</b>
            <b>Invalid {hardware.diagnostic.invalidMessages}</b>
            <b>Clock {hardware.diagnostic.clock.messages}</b>
            <b>Latency {hardware.diagnostic.latencyEstimateMs ?? "manual"}</b>
          </div>
          <div className="controlRow">
            <button className="secondary" onClick={exportReport}>Export diagnostic report</button>
            <button className="secondary" onClick={() => commitHardware({ ...hardware, diagnostic: { ...hardware.diagnostic, events: [] } })}>Clear log</button>
          </div>
          <div className="eventList tall">
            {hardware.diagnostic.events.map((event, index) => <p key={`${event.message}-${index}`}>{event.type}: {event.message}</p>)}
          </div>
          {lastReport ? <pre className="arrangerSnapshot">{JSON.stringify(lastReport, null, 2)}</pre> : null}
        </article>

        <article className="card wide">
          <h2>Manual Validation</h2>
          <p>{manualChecklist.device}: {statusText(manualChecklist.verificationStatus)}</p>
          <div className="manualChecklist">
            {manualChecklist.tests.map((item) => <span key={item.name}>{item.name}: {item.status}</span>)}
          </div>
        </article>
      </div>
    </section>
  );
}
