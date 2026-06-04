import React, { useEffect, useState } from 'react';
import {
  requestMidiAccess,
  getMidiInputs,
  loadControllerProfile,
  attachMidiInput
} from '../midi/universalMidi';

export default function UniversalMidiControllerPanel() {
  const [supported, setSupported] = useState(true);
  const [inputs, setInputs] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState('');
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function boot() {
      try {
        const profileData = await loadControllerProfile('/midi-profiles/generic-midi-controller.json');
        setProfile(profileData);

        const access = await requestMidiAccess({ sysex: false });
        const foundInputs = getMidiInputs(access);
        setInputs(foundInputs);

        access.onstatechange = () => {
          setInputs(getMidiInputs(access));
        };
      } catch (err) {
        setError(err.message);
        setSupported(false);
      }
    }

    boot();
  }, []);

  useEffect(() => {
    if (!selectedInputId || !profile) return;

    const input = inputs.find(item => item.id === selectedInputId)?.input;
    if (!input) return;

    const detach = attachMidiInput(input, profile, mapped => {
      setEvents(previous => [mapped, ...previous].slice(0, 30));
    });

    return detach;
  }, [selectedInputId, profile, inputs]);

  if (!supported) {
    return (
      <section style={{ padding: 24, border: '1px solid #333', borderRadius: 12 }}>
        <h2>Universal MIDI Brain</h2>
        <p style={{ color: 'tomato' }}>{error}</p>
        <p>Use Chrome or Edge with Web MIDI support, or use the Electron desktop version.</p>
      </section>
    );
  }

  return (
    <section style={{ padding: 24, border: '1px solid #333', borderRadius: 12 }}>
      <h2>Universal MIDI Brain</h2>

      <p>
        Connect any standard MIDI controller. UAOS will translate notes, CC,
        program changes, pitch bend, aftertouch, and future custom mappings
        into arranger actions.
      </p>

      <label>MIDI Input</label>

      <select
        style={{ display: 'block', padding: 10, marginTop: 8, marginBottom: 16, width: '100%' }}
        value={selectedInputId}
        onChange={event => setSelectedInputId(event.target.value)}
      >
        <option value="">Select MIDI device</option>
        {inputs.map(input => (
          <option key={input.id} value={input.id}>
            {input.name || input.id}
          </option>
        ))}
      </select>

      <h3>Loaded Profile</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {profile ? `${profile.name} (${profile.id})` : 'Loading...'}
      </pre>

      <h3>Live MIDI Events</h3>

      <div style={{ maxHeight: 320, overflow: 'auto', background: '#111', padding: 12 }}>
        {events.map((item, index) => (
          <pre key={index} style={{ whiteSpace: 'pre-wrap', marginBottom: 10 }}>
            {JSON.stringify(item, null, 2)}
          </pre>
        ))}
      </div>
    </section>
  );
}
