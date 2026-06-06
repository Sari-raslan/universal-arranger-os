import React, { useState } from 'react';
import { uploadSheetMusic } from '../services/sheetMusicApi.js';

export default function SheetMusicFixPanel() {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Uploading and analyzing sheet music...');
    setResult(null);

    try {
      const data = await uploadSheetMusic(file);
      setResult(data);
      setStatus('Sheet music accepted. UAOS prepared an analysis result.');
    } catch (err) {
      setStatus(
        `Could not fully analyze this sheet yet. The file was accepted, but professional OMR needs more training. Error: ${err.message}`
      );
    }
  }

  return (
    <section className="uaosProductBand sheetMusicFixPanel">
      <div>
        <p className="eyebrow">Sheet Music</p>
        <h2>Sheet Music Image / PDF Analysis</h2>
        <p>
          Upload a sheet music image or PDF. UAOS will process it through the OMR pipeline
          and prepare it for MIDI/arrangement conversion.
        </p>
      </div>

      <label className="sheetUploadControl">
        <span>Choose sheet file</span>
        <input type="file" accept="image/*,.pdf" onChange={onFile} />
      </label>

      {status && <p className="saveStatus sheetStatus">{status}</p>}

      {result && (
        <pre className="uaosOutput">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </section>
  );
}
