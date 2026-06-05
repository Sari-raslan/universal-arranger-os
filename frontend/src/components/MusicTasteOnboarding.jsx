import React, { useState } from 'react';

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

export default function MusicTasteOnboarding() {
  const [status, setStatus] = useState('');

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const payload = {
      favoriteGenres: form.get('genres')?.toString() || '',
      favoriteArtists: form.get('artists')?.toString() || '',
      youtube: form.get('youtube')?.toString() || '',
      spotify: form.get('spotify')?.toString() || '',
      zodiac: form.get('zodiac')?.toString() || '',
      zodiacOptIn: form.get('zodiacOptIn') === 'on'
    };

    localStorage.setItem('uaos_music_taste', JSON.stringify(payload));
    setStatus('Saved. UAOS will use this taste profile for arrangements.');
  }

  return (
    <section id="music-taste" className="tastePanel">
      <div>
        <p className="eyebrow">Personal arranger profile</p>
        <h2>Teach UAOS Your Music Taste</h2>
        <p className="muted">
          Save favorite genres, artists, playlists, and an optional playful zodiac flavor for arrangement suggestions.
        </p>
      </div>

      <form className="tasteForm" onSubmit={submit}>
        <input name="genres" placeholder="Favorite genres" />
        <input name="artists" placeholder="Favorite artists" />
        <input name="youtube" placeholder="YouTube playlist/channel link" />
        <input name="spotify" placeholder="Spotify playlist link" />
        <select name="zodiac">
          <option value="">Optional fun zodiac style</option>
          {zodiacSigns.map((sign) => (
            <option key={sign} value={sign}>{sign}</option>
          ))}
        </select>
        <label className="checkboxLabel">
          <input type="checkbox" name="zodiacOptIn" />
          Use zodiac as a fun optional music flavor
        </label>
        <button type="submit">Save Taste</button>
      </form>

      {status ? <p className="saveStatus">{status}</p> : null}
    </section>
  );
}
