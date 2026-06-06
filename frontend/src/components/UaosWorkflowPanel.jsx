import React from 'react';

export default function UaosWorkflowPanel() {
  const steps = [
    ['1', 'Upload', 'Add MIDI, audio, style files, sheet music images, or PDF files.'],
    ['2', 'Analyze', 'UAOS reads your file and extracts musical information.'],
    ['3', 'Learn Taste', 'UAOS builds your personal music taste profile from your sources.'],
    ['4', 'Arrange', 'The engine creates a personalized arrangement plan.'],
    ['5', 'Export', 'Prepare MIDI, MusicXML, keyboard style, or production-ready outputs.']
  ];

  return (
    <section className="uaosProductBand">
      <div>
        <p className="eyebrow">Workflow</p>
        <h2>How UAOS Works</h2>
      </div>

      <div className="uaosWorkflow">
        {steps.map(([number, title, text]) => (
          <article className="uaosStep" key={number}>
            <strong>{number}</strong>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
