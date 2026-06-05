import React from 'react';

export default function FeaturesPage() {
  return (
    <main style={{ padding: 40, maxWidth: 1000, margin: '0 auto' }}>
      <h1>AI Features</h1>

      <section>
        <h2>OMR: Sheet Music to MIDI</h2>
        <p>Upload sheet music images and convert them into MIDI and MusicXML pipeline output.</p>
      </section>

      <section>
        <h2>Live Audio to MIDI</h2>
        <p>Record a melody from the microphone and generate MIDI plus an arrangement plan.</p>
      </section>

      <section>
        <h2>Arranger Intelligence</h2>
        <p>Choose full arrangement, Ork keyboard style, or computer studio production direction.</p>
      </section>

      <section>
        <h2>Sound Engine</h2>
        <p>Factory sound library foundation for UAOS workstation playback and arrangement.</p>
      </section>

      <section>
        <h2>Multi-format Manager</h2>
        <p>Designed for SET, STY, MID, KMP, PAD and related arranger workstation files.</p>
      </section>
    </main>
  );
}
