import React, { useState } from 'react';
import { uploadSheetMusic } from '../services/sheetMusicApi.js';

export default function ProfessionalOmrPanel() {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function uploadSheet(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError('');
    setResult(null);

    try {
      const data = await uploadSheetMusic(file);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ padding: 24, border: '1px solid #333', borderRadius: 12 }}>
      <h2>Professional OMR Engine</h2>

      <p>
        Upload a sheet music image. UAOS will run computer vision,
        staff segmentation, symbol classification, MusicXML generation,
        MIDI export, rhythm reconstruction, and voice/chord separation.
      </p>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={uploadSheet}
      />

      {busy && <p>Analyzing sheet music...</p>}
      {error && <p style={{ color: 'tomato' }}>{error}</p>}

      {result && (
        <div>
          <h3>OMR Result</h3>
          <p>{result.message}</p>
          {result.midiPath && <p>MIDI: {result.midiPath}</p>}
          {result.musicXmlPath && <p>MusicXML: {result.musicXmlPath}</p>}
          {result.staffSegmentation?.systems && <p>Systems: {result.staffSegmentation.systems.length}</p>}
          {result.symbols && <p>Symbols: {result.symbols.length}</p>}
          {result.rhythm?.notes && <p>Notes: {result.rhythm.notes.length}</p>}

          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
            {JSON.stringify(result.quality || result.analysis, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
