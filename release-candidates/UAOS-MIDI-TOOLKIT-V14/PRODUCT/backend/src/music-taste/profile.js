export function buildMusicTasteProfile(input = {}) {
  return {
    genres: input.favoriteGenres || '',
    artists: input.favoriteArtists || '',
    youtube: input.youtube || '',
    spotify: input.spotify || '',
    sheetMusic: Array.isArray(input.sheetMusic) ? input.sheetMusic : [],
    zodiac: input.zodiacOptIn ? input.zodiac || null : null,
    note: 'Zodiac is optional entertainment only, not required.'
  };
}
