import React, { useState } from 'react';
import { saveTasteProfile } from '../services/musicTasteApi';

const zodiacSigns = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces'
];

export default function MusicTasteUploadPanel() {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setStatus('Saving taste profile...');
    setResult(null);

    try {
      const form = new FormData(event.currentTarget);
      const data = await saveTasteProfile(form);
      setResult(data.profile);
      setStatus('Taste profile saved successfully.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="tasteUploadPanel">
      <div>
        <p className="eyebrow">Phase 10 learning API</p>
        <h2>Upload Music Taste Sources</h2>
        <p className="muted">
          Add genres, artists, playlist links, MIDI, audio, PDF, or sheet music images for the backend taste profile.
        </p>
      </div>

      <form className="tasteForm" onSubmit={submit}>
        <input name="favoriteGenres" placeholder="Favorite genres" />
        <input name="favoriteArtists" placeholder="Favorite artists" />
        <input name="spotify" placeholder="Spotify playlist link" />
        <input name="youtube" placeholder="YouTube playlist/channel link" />

        <select name="zodiac">
          <option value="">Optional fun zodiac flavor</option>
          {zodiacSigns.map((sign) => (
            <option key={sign} value={sign}>{sign}</option>
          ))}
        </select>

        <label className="checkboxLabel">
          <input type="checkbox" name="zodiacOptIn" value="true" />
          Use zodiac as fun optional flavor only
        </label>

        <input name="files" type="file" multiple accept=".mid,.midi,.mp3,.wav,.pdf,image/*" />

        <button type="submit">Save Music Taste</button>
      </form>

      {status ? <p className="saveStatus">{status}</p> : null}

      {result ? (
        <pre className="tasteResult">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
