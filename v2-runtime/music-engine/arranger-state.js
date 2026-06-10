export const arrangerSections = [
  'intro1',
  'intro2',
  'variation1',
  'variation2',
  'variation3',
  'variation4',
  'fill',
  'break',
  'ending1',
  'ending2'
];

export function createArrangerState() {
  return {
    section: 'variation1',
    tempo: 120,
    playing: false,
    styleLoaded: false
  };
}
