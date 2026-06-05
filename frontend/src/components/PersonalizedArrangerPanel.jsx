import React, { useState } from 'react';
import { personalizeArrangement } from '../services/arrangerApi';

export default function PersonalizedArrangerPanel() {
  const [melody, setMelody] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');

  async function run() {
    setStatus('Creating personalized arrangement...');
    setResult(null);

    try {
      const tasteProfile = JSON.parse(localStorage.getItem('uaos_music_taste') || '{}');
      const data = await personalizeArrangement({
        melody,
        tasteProfile
      });

      setResult(data.arrangement);
      setStatus('Personalized arrangement ready.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="arrangerPanel">
      <div>
        <p className="eyebrow">Phase 11 arranger engine</p>
        <h2>Personalized Arranger</h2>
        <p className="muted">
          Give UAOS a melody idea and it will shape an arrangement from your saved music taste.
        </p>
      </div>

      <div className="tasteForm">
        <textarea
          rows="5"
          value={melody}
          onChange={(event) => setMelody(event.target.value)}
          placeholder="Type melody idea, chord progression, MIDI notes, or song direction..."
        />

        <button type="button" onClick={run}>
          Generate Personalized Arrangement
        </button>
      </div>

      {status ? <p className="saveStatus">{status}</p> : null}

      {result ? (
        <pre className="tasteResult">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
