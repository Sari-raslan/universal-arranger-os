export async function scanWebMidi(){
  if (!navigator.requestMIDIAccess) return { ok:false, reason:"Web MIDI not supported" };
  const access = await navigator.requestMIDIAccess();
  return {
    ok:true,
    inputs:[...access.inputs.values()].map(d=>d.name),
    outputs:[...access.outputs.values()].map(d=>d.name)
  };
}

export async function playTestNote(note=60){
  if (!navigator.requestMIDIAccess) return { ok:false };
  const access = await navigator.requestMIDIAccess();
  const out = [...access.outputs.values()][0];
  if (!out) return { ok:false, reason:"No MIDI output" };
  out.send([0x90, note, 100]);
  setTimeout(()=>out.send([0x80, note, 0]), 500);
  return { ok:true, note, output:out.name };
}