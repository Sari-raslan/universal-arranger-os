import React, { useEffect, useState } from 'react';
import {
  startAudioEngine,
  createInstrumentFromPreset,
  playNote,
  playChord,
  playDemoPattern
} from '../sounds/uaosSoundEngine';
import {
  loadUaosFactorySounds,
  groupPresetsByCategory
} from '../sounds/soundLibrary';

export default function SoundLibraryPanel() {
  const [library, setLibrary] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUaosFactorySounds()
      .then(setLibrary)
      .catch(err => setError(err.message));
  }, []);

  async function selectPreset(preset) {
    await startAudioEngine();
    createInstrumentFromPreset(preset);
    setSelectedPreset(preset);
    setReady(true);
  }

  const groups = library ? groupPresetsByCategory(library.presets) : {};

  return (
    <section style={{ padding: 24, border: '1px solid #333', borderRadius: 12 }}>
      <h2>UAOS Sound Library</h2>

      <p>
        Original UAOS factory sounds for bass, piano, pads, leads,
        plucks, and drums. No copyrighted third-party samples included.
      </p>

      {error && <p style={{ color: 'tomato' }}>{error}</p>}

      {!library && !error && <p>Loading sound library...</p>}

      {Object.entries(groups).map(([category, presets]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <h3>{category.toUpperCase()}</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: selectedPreset?.id === preset.id ? '2px solid gold' : '1px solid #555',
                  background: '#111',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedPreset && (
        <div style={{ marginTop: 24 }}>
          <h3>Selected: {selectedPreset.name}</h3>
          <p>{selectedPreset.description}</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => playNote('C4', '4n')}>Play C</button>
            <button onClick={() => playChord(['C4', 'E4', 'G4'], '2n')}>Play Chord</button>
            <button onClick={() => playDemoPattern(selectedPreset.category)}>Play Demo</button>
          </div>

          {!ready && <p>Click a sound to start audio engine.</p>}
        </div>
      )}
    </section>
  );
}
