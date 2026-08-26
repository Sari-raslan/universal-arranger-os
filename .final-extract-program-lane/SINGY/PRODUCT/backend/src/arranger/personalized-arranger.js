function tasteField(tasteProfile, keys) {
  return keys
    .map((key) => tasteProfile?.[key])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function buildArrangementPlan({ melody, tasteProfile = {} }) {
  const genres = tasteField(tasteProfile, ['genres', 'favoriteGenres']);
  const artists = tasteField(tasteProfile, ['artists', 'favoriteArtists']);
  const zodiac = tasteProfile?.zodiac || null;

  let groove = 'modern-pop';
  let harmony = 'warm-triads';
  let tempo = 100;
  let instrumentation = ['piano', 'bass', 'drums', 'strings'];
  let emotion = 'balanced';

  if (genres.includes('khaleeji') || genres.includes('arabic') || genres.includes('\u0639\u0631\u0628\u064a')) {
    groove = 'arabic-khaleeji';
    harmony = 'maqam-inspired';
    tempo = 92;
    instrumentation = ['oud', 'qanun', 'arabic-percussion', 'strings'];
    emotion = 'expressive';
  }

  if (genres.includes('jazz')) {
    groove = 'swing-jazz';
    harmony = 'extended-7th-9th';
    tempo = 110;
    instrumentation = ['electric-piano', 'upright-bass', 'brush-drums', 'sax'];
    emotion = 'sophisticated';
  }

  if (genres.includes('edm') || genres.includes('dance')) {
    groove = 'four-on-floor';
    harmony = 'simple-anthemic';
    tempo = 124;
    instrumentation = ['synth-lead', 'sub-bass', 'edm-drums', 'pads'];
    emotion = 'energetic';
  }

  if (artists.includes('fairuz') || artists.includes('\u0641\u064a\u0631\u0648\u0632')) {
    harmony = 'levantine-classic';
    instrumentation = ['oud', 'accordion', 'strings', 'soft-percussion'];
    emotion = 'nostalgic';
  }

  if (zodiac && tasteProfile?.zodiacOptIn !== false) {
    emotion = `${emotion}-with-${String(zodiac).toLowerCase()}-fun-color`;
  }

  return {
    ok: true,
    melody: melody || '',
    tasteProfile,
    arrangement: {
      groove,
      harmony,
      tempo,
      instrumentation,
      emotion,
      sections: [
        { name: 'Intro', bars: 4 },
        { name: 'Verse', bars: 8 },
        { name: 'Chorus', bars: 8 },
        { name: 'Bridge', bars: 4 },
        { name: 'Final Chorus', bars: 8 }
      ],
      exportTargets: ['MIDI', 'STYLE', 'STY', 'SET', 'MusicXML']
    }
  };
}
