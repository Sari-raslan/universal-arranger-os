export function createSessionReport(data) {
  return {
    ok: true,
    title: "UAOS Session Report",
    summary: {
      phase: data.state?.phase || "2/3",
      style: data.state?.style,
      tempo: data.state?.tempo,
      chord: data.state?.chord,
      section: data.state?.section,
      device: data.state?.device
    },
    engine: {
      player: data.player?.status?.() || data.player,
      sequencer: data.sequencer?.status?.() || data.sequencer,
      mixer: data.mixer?.status?.() || data.mixer,
      clock: data.clock?.status?.() || data.clock,
      recorder: data.recorder?.status?.() || data.recorder,
      song: data.song?.status?.() || data.song
    },
    generatedAt: new Date().toISOString()
  };
}