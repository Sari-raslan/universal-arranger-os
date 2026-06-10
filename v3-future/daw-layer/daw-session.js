export function createDawSession() {
  return {
    tracks: [],
    tempo: 120,
    timeSignature: '4/4',
    transport: 'stopped',
    addTrack(track) {
      this.tracks.push(track);
      return this.tracks;
    }
  };
}
