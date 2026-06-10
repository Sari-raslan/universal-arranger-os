export const orientalKeywords = [
  'arabic',
  'oriental',
  'kamanjat',
  'kamnjat',
  'oud',
  'ney',
  'qanun',
  'kanun',
  'duduk',
  'khaliji',
  'fayez',
  'faycel',
  'juzi',
  'dede',
  'hr strings',
  'oriental strings',
  'turkish',
  'iraqi',
  'syria',
  'egypt',
  'maqam',
  'quarter tone'
];

export function detectOrientalLibrary(path='') {
  const p = path.toLowerCase();

  const matches = orientalKeywords.filter(k => p.includes(k));

  return {
    path,
    oriental: matches.length > 0,
    score: matches.length,
    matches
  };
}
