import { useMemo, useState } from "react";
import {
  DEFAULT_PPQ,
  addMidiNote,
  applyHardwareTransport,
  arrangerToTracks,
  cancelExportJob,
  createAudioClip,
  createAutosaveState,
  createDawProject,
  createExportJob,
  createMidiClip,
  createRecoverySnapshot,
  createTrack,
  duplicateClip,
  evaluateAutomation,
  importAiMelody,
  linkPhase6Hardware,
  migrateDawProject,
  moveClip,
  placeClip,
  quantizeMidiClip,
  reduceTransport,
  resizeClip,
  splitClip,
  startAudioRecording,
  startMidiRecording,
  stopAudioRecording,
  stopMidiRecording,
  ticksToMusical,
  ticksToSeconds,
  transposeMidiClip,
  updateChannelStrip,
  validateDawProject,
} from "../daw/dawPhase7.js";

function formatPosition(project) {
  const pos = ticksToMusical(project.transport.playheadTick, project.timeSignature, DEFAULT_PPQ);
  return `${pos.bar}.${pos.beat}.${pos.tick}`;
}

function status(value) {
  return String(value || "unknown").replaceAll("-", " ");
}

export function DAWStudioPanel({ session, onSessionChange }) {
  const initialProject = useMemo(() => migrateDawProject(session?.dawProject), [session?.dawProject]);
  const [project, setProject] = useState(initialProject);
  const [selectedTrackId, setSelectedTrackId] = useState(initialProject.tracks[0]?.id || null);
  const [selectedClipId, setSelectedClipId] = useState(initialProject.tracks[0]?.clips[0]?.id || null);
  const [exportJob, setExportJob] = useState(null);
  const [history, setHistory] = useState({ undo: [], redo: [], dirty: false });
  const selectedTrack = project.tracks.find((track) => track.id === selectedTrackId) || project.tracks[0];
  const selectedClip = project.tracks.flatMap((track) => track.clips).find((clip) => clip.id === selectedClipId) || selectedTrack?.clips[0] || null;
  const validation = validateDawProject(project);

  function commit(nextProject, label = "edit") {
    setHistory((current) => ({ undo: [...current.undo.slice(-49), { label, project }], redo: [], dirty: true }));
    setProject(nextProject);
    onSessionChange?.({ ...session, dawProject: nextProject });
  }

  function restore(nextProject, direction) {
    setProject(nextProject);
    onSessionChange?.({ ...session, dawProject: nextProject });
    setHistory((current) => direction === "undo"
      ? { undo: current.undo.slice(0, -1), redo: [{ label: "redo", project }, ...current.redo], dirty: true }
      : { undo: [...current.undo, { label: "undo", project }], redo: current.redo.slice(1), dirty: true });
  }

  function addTrack(type) {
    const count = project.tracks.filter((track) => track.type === type).length + 1;
    const track = createTrack(type, count, { color: type === "midi" ? "#9fe7c8" : type === "sampler" ? "#8b5cf6" : "#00ccff" });
    const next = { ...project, tracks: [...project.tracks.filter((item) => item.type !== "master"), track, ...project.tracks.filter((item) => item.type === "master")] };
    commit({ ...next, mixer: { ...project.mixer, strips: [...project.mixer.strips, { ...track, order: project.mixer.strips.length + 1, meter: { peak: 0, rms: 0, clipping: false } }] } }, `add ${type}`);
    setSelectedTrackId(track.id);
  }

  function deleteSelectedTrack() {
    if (!selectedTrack || selectedTrack.type === "master") return;
    const nextTracks = project.tracks.filter((track) => track.id !== selectedTrack.id);
    commit({ ...project, tracks: nextTracks, mixer: { ...project.mixer, strips: project.mixer.strips.filter((strip) => strip.id !== selectedTrack.id) } }, "delete track");
    setSelectedTrackId(nextTracks[0]?.id || null);
  }

  function updateTrack(changes) {
    commit({
      ...project,
      tracks: project.tracks.map((track) => track.id === selectedTrack.id ? { ...track, ...changes } : track),
      mixer: updateChannelStrip(project.mixer, selectedTrack.id, changes),
    }, "track edit");
  }

  function addClip(type) {
    if (!selectedTrack) return;
    const clip = type === "midi"
      ? addMidiNote(createMidiClip(selectedTrack.clips.length + 1, { trackId: selectedTrack.id, startTick: project.timeline.playheadTick }), { tick: 0, pitch: 60, velocity: 96, durationTicks: DEFAULT_PPQ / 2 })
      : createAudioClip(selectedTrack.clips.length + 1, { trackId: selectedTrack.id, startTick: project.timeline.playheadTick, assetId: "local-pending-asset" });
    const result = placeClip(project, selectedTrack.id, clip, { overlapRule: "allow" });
    if (result.ok) {
      commit(result.project, `add ${type} clip`);
      setSelectedClipId(clip.id);
    }
  }

  function editClip(action) {
    if (!selectedClip || !selectedTrack) return;
    let nextClips = selectedTrack.clips;
    if (action === "move") nextClips = selectedTrack.clips.map((clip) => clip.id === selectedClip.id ? moveClip(clip, clip.startTick + DEFAULT_PPQ, project.timeline.snap.gridTicks) : clip);
    if (action === "resize") nextClips = selectedTrack.clips.map((clip) => clip.id === selectedClip.id ? resizeClip(clip, clip.durationTicks + DEFAULT_PPQ) : clip);
    if (action === "duplicate") nextClips = [...selectedTrack.clips, duplicateClip(selectedClip)];
    if (action === "delete") nextClips = selectedTrack.clips.filter((clip) => clip.id !== selectedClip.id);
    if (action === "split") {
      const split = splitClip(selectedClip, selectedClip.startTick + Math.round(selectedClip.durationTicks / 2));
      if (split.ok) nextClips = selectedTrack.clips.flatMap((clip) => clip.id === selectedClip.id ? split.clips : [clip]);
    }
    commit({ ...project, tracks: project.tracks.map((track) => track.id === selectedTrack.id ? { ...track, clips: nextClips } : track) }, `clip ${action}`);
  }

  function editMidi(action) {
    if (!selectedClip || selectedClip.type !== "midi" || !selectedTrack) return;
    let nextClip = selectedClip;
    if (action === "note") nextClip = addMidiNote(nextClip, { tick: DEFAULT_PPQ, pitch: 64, velocity: 90, durationTicks: DEFAULT_PPQ / 2 });
    if (action === "quantize") nextClip = quantizeMidiClip(nextClip, DEFAULT_PPQ / 4);
    if (action === "transpose") nextClip = transposeMidiClip(nextClip, 12);
    commit({ ...project, tracks: project.tracks.map((track) => track.id === selectedTrack.id ? { ...track, clips: track.clips.map((clip) => clip.id === nextClip.id ? nextClip : clip) } : track) }, `midi ${action}`);
  }

  function transport(type) {
    commit({ ...project, transport: reduceTransport(project.transport, { type }, project) }, `transport ${type}`);
  }

  function saveProject() {
    const autosave = createRecoverySnapshot(project, { ...createAutosaveState(), ...project.autosave }, new Date().toISOString());
    commit({ ...project, autosave }, "save");
    setHistory((current) => ({ ...current, dirty: false }));
  }

  function applyArranger() {
    const converted = arrangerToTracks(session?.arranger || undefined);
    commit({ ...project, tracks: [...project.tracks.filter((track) => !track.id.startsWith("arranger-")), ...converted.tracks, ...project.tracks.filter((track) => track.type === "master")], regions: converted.regions, markers: [...project.markers, ...converted.markers] }, "arranger import");
  }

  function importAi() {
    const melody = session?.aiMusic?.voiceMelodies?.[0] || { notes: [{ start: 0, duration: 0.5, midi: 60, velocity: 90 }, { start: 0.5, duration: 0.5, midi: 64, velocity: 88 }], confidence: 0.7 };
    const clip = importAiMelody(melody, selectedTrack?.id || "midi-001");
    const targetTrack = selectedTrack?.type === "midi" ? selectedTrack : project.tracks.find((track) => track.type === "midi");
    if (!targetTrack) return;
    const result = placeClip(project, targetTrack.id, clip, { overlapRule: "allow" });
    if (result.ok) commit(result.project, "ai melody import");
  }

  function linkHardware() {
    commit(linkPhase6Hardware(project, session?.hardware), "hardware link");
  }

  function hardwarePlay() {
    commit({ ...project, transport: applyHardwareTransport(project.transport, { command: "transport.start" }) }, "hardware transport");
  }

  function recordAudio() {
    const active = project.recording.audio.activeTake;
    if (!active) {
      const result = startAudioRecording(project.recording, selectedTrack?.id || "audio-001", { tick: project.transport.playheadTick, time: ticksToSeconds(project.transport.playheadTick, project.tempoMap) });
      if (result.ok) commit({ ...project, transport: reduceTransport(project.transport, { type: "record" }), recording: result.recording }, "audio record start");
      return;
    }
    const stopped = stopAudioRecording(project.recording, { durationSeconds: 2, durationTicks: DEFAULT_PPQ * 2 });
    if (stopped.ok) {
      const result = placeClip({ ...project, recording: stopped.recording, transport: reduceTransport(project.transport, { type: "stop" }) }, stopped.clip.trackId, stopped.clip, { overlapRule: "allow" });
      commit(result.project, "audio record stop");
    }
  }

  function recordMidi() {
    const armed = project.recording.midi.recordArmTrackIds.includes(selectedTrack?.id);
    if (!armed) {
      commit({ ...project, recording: startMidiRecording(project.recording, selectedTrack?.id || "midi-001", { tick: project.transport.playheadTick }), transport: reduceTransport(project.transport, { type: "record" }) }, "midi record start");
      return;
    }
    const stopped = stopMidiRecording(project.recording, selectedTrack?.id || "midi-001", { durationTicks: DEFAULT_PPQ * 2 });
    const result = placeClip({ ...project, recording: stopped.recording, transport: reduceTransport(project.transport, { type: "stop" }) }, stopped.clip.trackId, stopped.clip, { overlapRule: "allow" });
    commit(result.project, "midi record stop");
  }

  function startExport() {
    setExportJob(createExportJob(project, { range: project.loopRange, filename: `${project.name.replaceAll(" ", "_")}.wav` }));
  }

  const ledItems = [project.transport.state === "playing", project.transport.recording, history.dirty, validation.valid, project.hardwareLink.enabled, Boolean(exportJob && !exportJob.cancelled)];
  const automationPreview = project.automation[0] ? evaluateAutomation(project.automation[0], project.transport.playheadTick) : "no lane";

  return (
    <section className="dawStudio">
      <div className="dawTopBar">
        <div>
          <p className="eyebrow">UAOS DAW Studio</p>
          <input value={project.name} onChange={(event) => commit({ ...project, name: event.target.value }, "rename project")} aria-label="Project name" />
        </div>
        <div className="dawTopActions">
          <button onClick={saveProject}>Save</button>
          <button className="secondary" onClick={saveProject}>Save As</button>
          <button className="secondary" disabled={!history.undo.length} onClick={() => restore(history.undo[history.undo.length - 1].project, "undo")}>Undo</button>
          <button className="secondary" disabled={!history.redo.length} onClick={() => restore(history.redo[0].project, "redo")}>Redo</button>
          <button className="secondary">Settings</button>
        </div>
        <div className="dawStatus">
          <span>Autosave {history.dirty ? "dirty" : "clean"}</span>
          <span>Audio local</span>
          <span>MIDI browser</span>
          <span>Hardware {project.hardwareLink.selectedProfileId || "fallback"}</span>
        </div>
      </div>

      <div className="dawLedStrip">{ledItems.map((on, index) => <span key={index} className={on ? "on" : ""} />)}</div>

      <div className="dawTransport">
        {["start", "stop", "pause", "continue", "record", "rewind", "fastForward", "panic"].map((action) => <button key={action} onClick={() => transport(action)}>{status(action)}</button>)}
        <label><input type="checkbox" checked={project.transport.countIn.enabled} onChange={(event) => commit({ ...project, transport: { ...project.transport, countIn: { ...project.transport.countIn, enabled: event.target.checked } } }, "count-in")} /> Count-in</label>
        <label><input type="checkbox" checked={project.transport.metronome.enabled} onChange={(event) => commit({ ...project, transport: { ...project.transport, metronome: { ...project.transport.metronome, enabled: event.target.checked } } }, "metronome")} /> Metro</label>
        <label><input type="checkbox" checked={project.loopRange.enabled} onChange={(event) => commit({ ...project, loopRange: { ...project.loopRange, enabled: event.target.checked } }, "loop")} /> Loop</label>
        <label><input type="checkbox" checked={project.punchRange.enabled} onChange={(event) => commit({ ...project, punchRange: { ...project.punchRange, enabled: event.target.checked } }, "punch")} /> Punch</label>
        <input type="number" value={project.tempo} min="30" max="260" onChange={(event) => commit({ ...project, tempo: Number(event.target.value), transport: { ...project.transport, tempo: Number(event.target.value) } }, "tempo")} aria-label="Tempo" />
        <b>{formatPosition(project)}</b>
        <b>{ticksToSeconds(project.transport.playheadTick, project.tempoMap).toFixed(2)}s</b>
      </div>

      <div className="dawWorkspace">
        <aside className="dawTrackList">
          <div className="controlRow">
            {["audio", "midi", "sampler", "arranger", "bus"].map((type) => <button key={type} className="secondary" onClick={() => addTrack(type)}>+ {type}</button>)}
          </div>
          {project.tracks.map((track) => (
            <article key={track.id} className={track.id === selectedTrackId ? "dawTrack selected" : "dawTrack"} onClick={() => setSelectedTrackId(track.id)}>
              <input value={track.name} onChange={(event) => track.id === selectedTrackId && updateTrack({ name: event.target.value })} aria-label={`${track.name} name`} />
              <span>{track.type}</span>
              <div className="trackButtons">
                <button className={track.mute ? "active" : "secondary"} onClick={(event) => { event.stopPropagation(); setSelectedTrackId(track.id); updateTrack({ mute: !track.mute }); }}>M</button>
                <button className={track.solo ? "active" : "secondary"} onClick={(event) => { event.stopPropagation(); setSelectedTrackId(track.id); updateTrack({ solo: !track.solo }); }}>S</button>
                <button className={track.recordArm ? "active" : "secondary"} onClick={(event) => { event.stopPropagation(); setSelectedTrackId(track.id); updateTrack({ recordArm: !track.recordArm }); }}>R</button>
                <button className={track.monitor ? "active" : "secondary"} onClick={(event) => { event.stopPropagation(); setSelectedTrackId(track.id); updateTrack({ monitor: !track.monitor }); }}>I</button>
              </div>
              <select value={track.input} onChange={(event) => updateTrack({ input: event.target.value })}><option>none</option><option>mic</option><option>midi</option><option>hardware</option></select>
              <select value={track.output} onChange={(event) => updateTrack({ output: event.target.value })}><option>master</option><option>hardware-main</option><option>none</option></select>
            </article>
          ))}
          <button className="dangerButton" onClick={deleteSelectedTrack}>Delete Track</button>
        </aside>

        <main className="dawTimeline">
          <div className="dawRuler">
            {Array.from({ length: 9 }, (_, index) => <span key={index}>Bar {index + 1}</span>)}
          </div>
          <div className="dawPlayhead" style={{ left: `${Math.min(96, (project.transport.playheadTick / project.durationTicks) * 100)}%` }} />
          {project.tracks.map((track) => (
            <div key={track.id} className="dawLane">
              <strong>{track.name}</strong>
              <div className="dawClipRow">
                {track.clips.map((clip) => (
                  <button key={clip.id} className={clip.id === selectedClipId ? "dawClip selected" : "dawClip"} style={{ marginLeft: `${Math.min(45, clip.startTick / DEFAULT_PPQ) * 8}px`, width: `${Math.max(72, clip.durationTicks / 8)}px` }} onClick={() => { setSelectedTrackId(track.id); setSelectedClipId(clip.id); }}>
                    {clip.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="controlRow">
            <button onClick={() => addClip("midi")}>Add MIDI Clip</button>
            <button onClick={() => addClip("audio")}>Add Audio Clip</button>
            {["move", "resize", "split", "duplicate", "delete"].map((action) => <button key={action} className="secondary" onClick={() => editClip(action)}>{status(action)}</button>)}
            <label>Snap<input type="checkbox" checked={project.timeline.snap.enabled} onChange={(event) => commit({ ...project, timeline: { ...project.timeline, snap: { ...project.timeline.snap, enabled: event.target.checked } } }, "snap")} /></label>
            <input type="range" min="1" max="8" value={project.timeline.zoom.horizontal} onChange={(event) => commit({ ...project, timeline: { ...project.timeline, zoom: { ...project.timeline.zoom, horizontal: Number(event.target.value) } } }, "zoom")} aria-label="Timeline zoom" />
          </div>
        </main>

        <aside className="dawSidePanels">
          <article className="card">
            <h2>Track Inspector</h2>
            <p>{selectedTrack?.name}</p>
            <label>Gain<input type="range" min="0" max="2" step="0.01" value={selectedTrack?.gain || 0} onChange={(event) => updateTrack({ gain: Number(event.target.value) })} /></label>
            <label>Pan<input type="range" min="-1" max="1" step="0.01" value={selectedTrack?.pan || 0} onChange={(event) => updateTrack({ pan: Number(event.target.value) })} /></label>
            <label>Preset<input value={selectedTrack?.selectedPreset || ""} onChange={(event) => updateTrack({ selectedPreset: event.target.value })} /></label>
          </article>
          <article className="card">
            <h2>Integrations</h2>
            <div className="controlRow">
              <button className="secondary" onClick={applyArranger}>Arranger to Tracks</button>
              <button className="secondary" onClick={importAi}>Import AI Melody</button>
              <button className="secondary" onClick={linkHardware}>Link Hardware</button>
              <button className="secondary" onClick={hardwarePlay}>HW Play</button>
            </div>
            <p>Cloud AI disabled by default. SysEx disabled by default.</p>
          </article>
          <article className="card">
            <h2>Recording</h2>
            <div className="controlRow">
              <button onClick={recordAudio}>{project.recording.audio.activeTake ? "Stop Audio" : "Record Audio"}</button>
              <button onClick={recordMidi}>{project.recording.midi.recordArmTrackIds.includes(selectedTrack?.id) ? "Stop MIDI" : "Record MIDI"}</button>
            </div>
            <p>Audio permission: {project.recording.audio.permissionState}</p>
            <p>Input level: {project.recording.audio.inputLevel}</p>
          </article>
        </aside>
      </div>

      <div className="dawEditors">
        <article className="card pianoRoll">
          <h2>Piano Roll</h2>
          <div className="controlRow">
            <button onClick={() => editMidi("note")}>Create Note</button>
            <button className="secondary" onClick={() => editMidi("quantize")}>Quantize</button>
            <button className="secondary" onClick={() => editMidi("transpose")}>Octave Up</button>
            <button className="secondary" onClick={() => transport("panic")}>Panic</button>
          </div>
          <div className="pianoGrid">
            {(selectedClip?.notes || []).map((note) => <button key={note.id} style={{ left: `${note.tick / 24}px`, bottom: `${(note.pitch - 36) * 3}px`, width: `${Math.max(24, note.durationTicks / 16)}px` }}>{note.pitch}</button>)}
          </div>
          <div className="velocityLane">{(selectedClip?.notes || []).map((note) => <i key={note.id} style={{ height: `${Math.max(12, note.velocity / 1.6)}px` }} />)}</div>
        </article>

        <article className="card">
          <h2>Automation</h2>
          <p>Evaluation: {automationPreview}</p>
          <p>Modes: read, write metadata, touch metadata, latch metadata, trim metadata.</p>
        </article>

        <article className="card">
          <h2>Clip Inspector</h2>
          <p>{selectedClip ? `${selectedClip.type} / ${selectedClip.name}` : "No clip selected"}</p>
          <p>Start: {selectedClip?.startTick ?? 0}</p>
          <p>Duration: {selectedClip?.durationTicks ?? 0}</p>
        </article>
      </div>

      <div className="dawMixer">
        {project.mixer.strips.map((strip) => (
          <article key={strip.id} className="mixerStrip">
            <h3>{strip.name}</h3>
            <div className="meter"><i style={{ width: `${Math.min(100, strip.meter.peak * 100)}%` }} /></div>
            <label>Gain<input type="range" min="0" max="2" step="0.01" value={strip.gain} onChange={(event) => commit({ ...project, mixer: updateChannelStrip(project.mixer, strip.id, { gain: Number(event.target.value) }) }, "mixer gain")} /></label>
            <label>Pan<input type="range" min="-1" max="1" step="0.01" value={strip.pan} onChange={(event) => commit({ ...project, mixer: updateChannelStrip(project.mixer, strip.id, { pan: Number(event.target.value) }) }, "mixer pan")} /></label>
            <span>{strip.meter.clipping ? "Clipping" : "Meter ready"}</span>
          </article>
        ))}
      </div>

      <section className="panelSection">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Export Foundation</p>
            <h2>Local render contract</h2>
          </div>
          <div className="controlRow">
            <button onClick={startExport}>Prepare Export</button>
            <button className="secondary" disabled={!exportJob || exportJob.cancelled} onClick={() => setExportJob(cancelExportJob(exportJob))}>Cancel Export</button>
          </div>
        </div>
        {exportJob ? <pre className="arrangerSnapshot">{JSON.stringify(exportJob, null, 2)}</pre> : <p>Browser-supported local download only. No cloud upload. 24-bit/32-bit float export is not claimed.</p>}
        {!validation.valid ? <p className="errorText">{validation.errors.join(" ")}</p> : <p>Project validation passed.</p>}
      </section>
    </section>
  );
}
