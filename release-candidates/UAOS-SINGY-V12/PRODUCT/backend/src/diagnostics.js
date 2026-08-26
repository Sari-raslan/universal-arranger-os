export function diagnostics(modules){
  return {
    ok:true,
    checks:{
      state: !!modules.state,
      player: !!modules.player,
      recorder: !!modules.recorder,
      sequencer: !!modules.sequencer,
      mixer: !!modules.mixer,
      clock: !!modules.clock,
      song: !!modules.song,
      midiMap: !!modules.midiMap
    },
    advice:[
      "Keep frontend on Vercel",
      "Run backend on Railway/Render/Fly for production",
      "Use Web MIDI locally for real hardware testing"
    ],
    time:new Date().toISOString()
  };
}