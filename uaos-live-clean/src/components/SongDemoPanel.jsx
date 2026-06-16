import { useMemo, useState } from "react";
import {
  createSongDemoProject,
  exportProjectPackage,
  writeStandardMidiFile
} from "../song/songDemoEngine.js";

export function SongDemoPanel() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState("Choose a WAV or MP3 file.");
  const [error, setError] = useState("");

  const midiBytes = useMemo(() => project ? writeStandardMidiFile(project) : null, [project]);
  const midiUrl = useMemo(() => midiBytes ? objectUrl(midiBytes, "audio/midi") : "", [midiBytes]);
  const umsUrl = useMemo(() => project ? objectUrl(project.umsProject, "application/json") : "", [project]);
  const packageUrl = useMemo(() => project ? objectUrl(exportProjectPackage(project), "application/json") : "", [project]);
  const styleUrl = useMemo(() => project ? objectUrl(project.styleDraft, "application/json") : "", [project]);

  function chooseFile(event) {
    const next = event.target.files?.[0] || null;
    acceptFile(next);
  }

  function acceptFile(next) {
    setFile(next);
    setProject(null);
    setError("");
    setStatus(next ? "Audio ready. Press Analyze." : "Choose a WAV or MP3 file.");
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(next ? URL.createObjectURL(next) : "");
  }

  function loadDemoFile() {
    acceptFile(createDemoWavFile());
  }

  async function analyze() {
    if (!file) return;
    setError("");
    setStatus("Decoding and analyzing audio...");
    try {
      const buffer = await file.arrayBuffer();
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextCtor();
      const decoded = await ctx.decodeAudioData(buffer.slice(0));
      const mono = mixToMono(decoded);
      await ctx.close?.();
      const next = createSongDemoProject({
        samples: mono,
        sampleRate: decoded.sampleRate,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });
      setProject(next);
      setStatus("Analysis complete. Timeline, tracks, MIDI, UMS, and style draft are ready.");
    } catch (err) {
      setError(err.message || "Could not decode this audio file.");
      setStatus("Analysis failed.");
    }
  }

  function updateSection(id, patch) {
    setProject((current) => {
      if (!current) return current;
      const sections = current.sections.map((section) => section.id === id ? { ...section, ...patch } : section);
      return {
        ...current,
        sections,
        umsProject: { ...current.umsProject, sections },
        styleDraft: {
          ...current.styleDraft,
          parts: {
            intros: sections.filter((item) => item.type === "intro"),
            variations: sections.filter((item) => item.type === "variation"),
            fills: sections.filter((item) => item.type === "fill"),
            breaks: sections.filter((item) => item.type === "break"),
            endings: sections.filter((item) => item.type === "ending")
          }
        }
      };
    });
  }

  function updateNote(trackId, noteIndex, patch) {
    setProject((current) => {
      if (!current) return current;
      const tracks = current.tracks.map((track) => {
        if (track.id !== trackId) return track;
        const notes = track.notes.map((note, index) => index === noteIndex ? { ...note, ...patch } : note);
        return { ...track, notes };
      });
      return {
        ...current,
        tracks,
        umsProject: { ...current.umsProject, tracks: tracks.map(({ id, name, channel, program, notes }) => ({ id, name, channel, program, notes })) },
        styleDraft: { ...current.styleDraft, lanes: tracks.map((track) => ({ id: track.id, name: track.name, noteCount: track.notes.length })) }
      };
    });
  }

  return (
    <section className="songDemo">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Real Song Demo</p>
          <h1>Upload, analyze, arrange, export</h1>
          <p className="lead">Load a WAV or MP3, preview it, run local analysis, review the generated timeline and tracks, then export a real Standard MIDI File plus UAOS project artifacts.</p>
        </div>
        <span className="clip">{project ? "Demo ready" : "Waiting"}</span>
      </div>

      <div className="uploadStrip">
        <label className="buttonLike">
          Choose WAV/MP3
          <input className="hiddenFile" type="file" accept="audio/wav,audio/x-wav,audio/mpeg,audio/mp3" onChange={chooseFile} />
        </label>
        <button className="secondary" onClick={loadDemoFile}>Load Demo WAV</button>
        <button onClick={analyze} disabled={!file}>Analyze</button>
        <span>{status}</span>
      </div>
      {error && <p className="errorText">{error}</p>}
      {audioUrl && <audio controls src={audioUrl} />}

      {project && (
        <>
          <Summary project={project} />
          <TimelineEditor sections={project.sections} onChange={updateSection} />
          <TracksEditor tracks={project.tracks} onChange={updateNote} />
          <ExportPanel project={project} midiBytes={midiBytes} urls={{ midiUrl, umsUrl, packageUrl, styleUrl }} />
        </>
      )}
    </section>
  );
}

function Summary({ project }) {
  const { metadata, analysis } = project;
  return (
    <div className="cards songSummary">
      <article className="card">
        <h3>Metadata</h3>
        <p>{metadata.fileName}</p>
        <b>{metadata.duration.toFixed(2)} sec</b>
      </article>
      <article className="card">
        <h3>Tempo / Meter</h3>
        <p>{analysis.tempo.bpm} BPM · {analysis.meter.value}</p>
        <b>{Math.round(analysis.tempo.confidence * 100)}% confidence</b>
      </article>
      <article className="card">
        <h3>Key / Chords</h3>
        <p>{analysis.key.name}</p>
        <b>{analysis.chordTimeline.length} chord regions</b>
      </article>
    </div>
  );
}

function TimelineEditor({ sections, onChange }) {
  return (
    <section className="panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Review and correct sections</h2>
        </div>
      </div>
      <div className="timelineRows">
        {sections.map((section) => (
          <div className="timelineRow" key={section.id}>
            <input value={section.name} onChange={(event) => onChange(section.id, { name: event.target.value })} />
            <select value={section.type} onChange={(event) => onChange(section.id, { type: event.target.value })}>
              <option value="intro">Intro</option>
              <option value="variation">Variation</option>
              <option value="fill">Fill</option>
              <option value="break">Break</option>
              <option value="ending">Ending</option>
            </select>
            <input type="number" min="0" step="0.1" value={section.start} onChange={(event) => onChange(section.id, { start: Number(event.target.value) })} />
            <input type="number" min="0" step="0.1" value={section.end} onChange={(event) => onChange(section.id, { end: Number(event.target.value) })} />
            <span>{Math.round(section.confidence * 100)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TracksEditor({ tracks, onChange }) {
  return (
    <section className="panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Tracks</p>
          <h2>Multi-track MIDI draft</h2>
        </div>
      </div>
      <div className="trackEditor">
        {tracks.map((track) => (
          <article className="card trackCard" key={track.id}>
            <h3>{track.name}</h3>
            <p>Channel {track.channel} · {track.notes.length} notes</p>
            <div className="noteRows">
              {track.notes.slice(0, 8).map((note, index) => (
                <div className="noteRow" key={`${track.id}-${index}`}>
                  <input type="number" min="0" step="0.1" value={note.start} onChange={(event) => onChange(track.id, index, { start: Number(event.target.value) })} />
                  <input type="number" min="0.05" step="0.05" value={note.duration} onChange={(event) => onChange(track.id, index, { duration: Number(event.target.value) })} />
                  <input type="number" min="0" max="127" value={note.midi} onChange={(event) => onChange(track.id, index, { midi: Number(event.target.value) })} />
                  <input type="number" min="1" max="127" value={note.velocity} onChange={(event) => onChange(track.id, index, { velocity: Number(event.target.value) })} />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExportPanel({ project, midiBytes, urls }) {
  const base = safeBaseName(project.metadata.fileName);
  const midiHeader = midiBytes ? String.fromCharCode(...midiBytes.slice(0, 4)) : "";
  return (
    <section className="panelSection live">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Exports</p>
          <h2>Download verified artifacts</h2>
          <p className="lead">Device-specific SET/STY exports are intentionally not listed here. This demo exports SMF MIDI, UMS JSON, UAOS package JSON, and a generic style draft only.</p>
        </div>
      </div>
      <div className="exportGrid">
        <a className="buttonLink" href={urls.midiUrl} download={`${base}.mid`}>Export MIDI</a>
        <a className="buttonLink" href={urls.umsUrl} download={`${base}.ums.json`}>Export UMS</a>
        <a className="buttonLink" href={urls.packageUrl} download={`${base}.uaos-package.json`}>Export UAOS Package</a>
        <a className="buttonLink" href={urls.styleUrl} download={`${base}.style-draft.json`}>Export Style Draft</a>
      </div>
      <p className="exportProof">MIDI SMF check: {midiHeader} · {midiBytes?.length || 0} bytes</p>
    </section>
  );
}

function mixToMono(decoded) {
  const mono = new Float32Array(decoded.length);
  for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
    const data = decoded.getChannelData(channel);
    for (let index = 0; index < decoded.length; index += 1) mono[index] += data[index] / decoded.numberOfChannels;
  }
  return mono;
}

function objectUrl(value, type) {
  const body = value instanceof Uint8Array ? value : JSON.stringify(value, null, 2);
  return URL.createObjectURL(new Blob([body], { type }));
}

function safeBaseName(name) {
  return String(name || "uaos-song").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "uaos-song";
}

function createDemoWavFile() {
  const sampleRate = 44100;
  const duration = 8;
  const samples = sampleRate * duration;
  const pcm = new Int16Array(samples);
  for (let index = 0; index < samples; index += 1) {
    const time = index / sampleRate;
    const pulse = Math.sin(2 * Math.PI * 2 * time) > 0.96 ? 0.42 : 0;
    const value = Math.max(-1, Math.min(1, Math.sin(2 * Math.PI * 220 * time) * 0.28 + pulse));
    pcm[index] = Math.round(value * 32767);
  }
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.byteLength, true);
  return new File([header, pcm], "uaos-demo-song.wav", { type: "audio/wav" });
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
}
