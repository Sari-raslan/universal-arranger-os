import React, { useState } from 'react';
import axios from 'axios';

const OMR_API = import.meta.env.VITE_OMR_API_URL || 'http://localhost:3002';

export default function SheetMusicUpload() {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('sheet', file);

    setBusy(true);
    setError('');

    try {
      const response = await axios.post(`${OMR_API}/api/omr/upload-sheet`, formData);
      setResult(response.data);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.error || err.message || 'Sheet upload failed.');
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
          <h3>Detected Notes</h3>

          <pre>{JSON.stringify(result.analysis, null, 2)}</pre>

          <h3>MIDI Generated</h3>

          <div>{result.midi}</div>
        </div>
      )}
    </div>
  );
}
