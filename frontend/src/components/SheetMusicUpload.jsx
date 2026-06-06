import React, { useState } from 'react';
import { uploadSheetMusic } from '../services/sheetMusicApi.js';

export default function SheetMusicUpload() {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError('');

    try {
      const data = await uploadSheetMusic(file);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message || 'Sheet upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ paddingTop: 20 }}>
      <h2>Upload Sheet Music Image</h2>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={upload}
      />

      {busy && <p className="muted">Analyzing sheet music...</p>}
      {error && <div className="error">{error}</div>}

      {result && (
        <div>
          <h3>Sheet Analysis</h3>

          <pre>{JSON.stringify(result.analysis, null, 2)}</pre>

          <h3>OMR Status</h3>

          <div>{result.message}</div>
        </div>
      )}
    </div>
  );
}
