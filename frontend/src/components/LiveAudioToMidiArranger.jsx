import React, { useRef, useState } from 'react';

const API = import.meta.env.VITE_LIVE_AUDIO_API || 'http://localhost:3020/api/live-audio';

function frequencyToNoteName(frequency) {
  if (!frequency) return '';
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
}

export default function LiveAudioToMidiArranger() {
  const [recording, setRecording] = useState(false);
  const [frequencies, setFrequencies] = useState([]);
  const [mode, setMode] = useState('full');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  async function start() {
    setError('');
    setResult(null);
    setFrequencies([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      streamRef.current = stream;

      const buffer = new Float32Array(analyser.fftSize);
      timerRef.current = window.setInterval(() => {
        analyser.getFloatTimeDomainData(buffer);

        let crossings = 0;
        for (let i = 1; i < buffer.length; i++) {
          if (
            (buffer[i - 1] < 0 && buffer[i] >= 0) ||
            (buffer[i - 1] > 0 && buffer[i] <= 0)
          ) {
            crossings++;
          }
        }

        const seconds = buffer.length / audioContext.sampleRate;
        const frequency = crossings / (2 * seconds);

        if (Number.isFinite(frequency) && frequency >= 70 && frequency <= 1200) {
          setFrequencies((prev) => [...prev, frequency].slice(-64));
        }
      }, 250);

      setRecording(true);
    } catch (err) {
      setError(`Microphone unavailable: ${err.message}`);
    }
  }

  async function stopAndArrange() {
    window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());

    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }

    setRecording(false);

    try {
      const response = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frequencies,
          mode
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Live audio analysis failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel liveAudioPanel">
      <div className="panelHeader">
        <h2>Live Audio to MIDI Arrangement</h2>
      </div>

      <p className="muted">
        Record a melody live. UAOS detects notes, converts to MIDI, then builds an arrangement.
      </p>

      <label className="fieldLabel" htmlFor="live-audio-mode">Arrangement mode</label>
      <select
        id="live-audio-mode"
        value={mode}
        onChange={(event) => setMode(event.target.value)}
        className="selectInput"
      >
        <option value="full">Full Ready Arrangement</option>
        <option value="ork">Ork / Keyboard Style</option>
        <option value="studio">Computer Studio</option>
      </select>

      {!recording ? (
        <button type="button" className="actionButton" onClick={start}>
          Start Live Recording
        </button>
      ) : (
        <button type="button" className="actionButton" onClick={stopAndArrange}>
          Stop and Generate MIDI Arrangement
        </button>
      )}

      <p className="muted">Detected notes: {frequencies.slice(-8).map(frequencyToNoteName).join(' ') || 'none yet'}</p>

      {error && <p className="error">{error}</p>}

      {result && (
        <div>
          <h3>Generated</h3>
          <p>MIDI: {result.midiPath}</p>
          <p>Arrangement: {result.arrangementPath}</p>
          <p>Mode: {result.mode}</p>
          <pre>{JSON.stringify(result.arrangement, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
