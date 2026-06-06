import React from 'react';
import LaunchHero from '../components/LaunchHero.jsx';
import MusicTasteOnboarding from '../components/MusicTasteOnboarding.jsx';
import MusicTasteUploadPanel from '../components/MusicTasteUploadPanel.jsx';
import PersonalizedArrangerPanel from '../components/PersonalizedArrangerPanel.jsx';
import UaosAiPlatformPanel from '../components/UaosAiPlatformPanel.jsx';
import UaosHeroActions from '../components/UaosHeroActions.jsx';
import UaosWorkflowPanel from '../components/UaosWorkflowPanel.jsx';
import SheetMusicFixPanel from '../components/SheetMusicFixPanel.jsx';
import UaosLiveAssistant from '../components/UaosLiveAssistant.jsx';

export default function LandingPage() {
  return (
    <main className="landingPage">
      <LaunchHero />

      <nav className="landingNav" aria-label="UAOS links">
        <a href="/pricing">Pricing</a>
        <a href="/downloads">Download</a>
        <a href="/features">AI Features</a>
        <a href="/demo">Watch Demo</a>
        <a href="/app">Open App</a>
      </nav>

      <section className="contentBand">
        <h2>What UAOS Does</h2>
        <ul>
          <li>Convert sheet music images into MIDI.</li>
          <li>Capture live melodies and generate arrangements.</li>
          <li>Manage SET, STY, MID, KMP, PAD and arranger files.</li>
          <li>Use factory sound libraries and sound engine foundations.</li>
          <li>Export and prepare music for desktop, Android, and studio workflows.</li>
        </ul>
      </section>

      <UaosHeroActions />
      <UaosWorkflowPanel />
      <SheetMusicFixPanel />
      <UaosLiveAssistant />
      <MusicTasteOnboarding />
      <MusicTasteUploadPanel />
      <PersonalizedArrangerPanel />
      <UaosAiPlatformPanel />

      <section className="contentBand">
        <h2>Platform Status</h2>
        <p>Web, Desktop, Android, OMR, Live Audio, PayPal, and Sound Library layers are active.</p>
      </section>
    </main>
  );
}
