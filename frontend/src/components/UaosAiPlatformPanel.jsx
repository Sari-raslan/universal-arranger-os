import React, { useState } from 'react';
import { getJson, postJson } from '../services/uaosApi';

export default function UaosAiPlatformPanel() {
  const [out, setOut] = useState(null);
  const [status, setStatus] = useState('');

  async function runAll() {
    setStatus('Running UAOS AI platform engine...');
    setOut(null);

    try {
      const taste = JSON.parse(localStorage.getItem('uaos_music_taste') || '{}');

      const arrangement = await postJson('/api/arranger/personalize', {
        melody: 'User melody idea',
        tasteProfile: taste
      });

      const midi = await postJson('/api/midi-engine/midi-plan', {
        arrangement: arrangement.arrangement
      });

      const style = await postJson('/api/midi-engine/style-plan', {
        arrangement: arrangement.arrangement
      });

      const plans = await getJson('/api/marketplace/plans');
      const readiness = await getJson('/api/release/readiness');

      setOut({ arrangement, midi, style, plans, readiness });
      setStatus('UAOS AI platform engine ready.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="arrangerPanel">
      <div>
        <p className="eyebrow">Phase 11-18 platform scaffold</p>
        <h2>UAOS AI Platform Engine</h2>
        <p className="muted">
          Runs personalized arrangement, MIDI planning, style planning, marketplace, and release readiness.
        </p>
      </div>

      <button type="button" onClick={runAll}>
        Run UAOS AI Engine
      </button>

      {status ? <p className="saveStatus">{status}</p> : null}

      {out ? (
        <pre className="tasteResult">
          {JSON.stringify(out, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
