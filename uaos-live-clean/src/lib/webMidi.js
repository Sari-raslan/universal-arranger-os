export function describeMidiSupport(navigatorLike) {
  return Boolean(navigatorLike?.requestMIDIAccess)
    ? { supported: true, label: "WebMIDI ready" }
    : { supported: false, label: "WebMIDI unavailable" };
}

export function summarizeMidiAccess(access) {
  const inputs = [...(access?.inputs?.values?.() || [])].map((input) => ({
    id: input.id,
    name: input.name || "MIDI Input",
    manufacturer: input.manufacturer || "",
    state: input.state || "unknown"
  }));
  const outputs = [...(access?.outputs?.values?.() || [])].map((output) => ({
    id: output.id,
    name: output.name || "MIDI Output",
    manufacturer: output.manufacturer || "",
    state: output.state || "unknown"
  }));

  return { inputs, outputs };
}

export function formatMidiMessage(data = []) {
  const [status = 0, data1 = 0, data2 = 0] = Array.from(data);
  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;

  if (command === 0x90 && data2 > 0) {
    return `CH${channel} NOTE ON ${data1} VEL ${data2}`;
  }

  if (command === 0x80 || command === 0x90) {
    return `CH${channel} NOTE OFF ${data1}`;
  }

  if (command === 0xb0) {
    return `CH${channel} CC ${data1} VAL ${data2}`;
  }

  if (command === 0xc0) {
    return `CH${channel} PROGRAM ${data1}`;
  }

  if (status === 0xf0 || status === 0xf7) {
    return `SYSEX ${Array.from(data).length} bytes`;
  }

  return `MIDI ${Array.from(data).map((byte) => byte.toString(16).padStart(2, "0")).join(" ")}`;
}
