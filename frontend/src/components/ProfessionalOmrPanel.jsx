import React, { useState } from 'react';

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
      const form = new FormData();
      form.append('sheet', file);

      const response = await fetch(
        'http://localhost:3002/api/omr/upload-sheet',
        {
          method: 'POST',
          body: form
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'OMR failed');
      }

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
          <p>MIDI: {result.midiPath}</p>
          <p>MusicXML: {result.musicXmlPath}</p>
          <p>Systems: {result.staffSegmentation.systems.length}</p>
          <p>Symbols: {result.symbols.length}</p>
          <p>Notes: {result.rhythm.notes.length}</p>

          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
            {JSON.stringify(result.quality, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
