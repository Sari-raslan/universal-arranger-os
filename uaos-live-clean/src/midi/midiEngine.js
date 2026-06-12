export function parseMidiMessage(data = [], timestamp = performance.now()) {
  const bytes = Array.from(data);
  const [status = 0, data1 = 0, data2 = 0] = bytes;
  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;
  const base = { raw: bytes, status, data1, data2, channel, timestamp };

  if (command === 0x90 && data2 > 0) return { ...base, type: "noteon", note: data1, velocity: data2 };
  if (command === 0x80 || command === 0x90) return { ...base, type: "noteoff", note: data1, velocity: data2 };
  if (command === 0xb0) return { ...base, type: "cc", controller: data1, value: data2 };
  if (command === 0xc0) return { ...base, type: "programchange", program: data1 };
  if (command === 0xe0) return { ...base, type: "pitchbend", value: ((data2 << 7) | data1) - 8192 };
  return { ...base, type: "unknown" };
}

export function formatMidiEvent(event) {
  if (!event) return "No event";
  if (event.type === "noteon") return `CH${event.channel} Note On ${event.note} vel ${event.velocity}`;
  if (event.type === "noteoff") return `CH${event.channel} Note Off ${event.note}`;
  if (event.type === "cc") return `CH${event.channel} CC ${event.controller} = ${event.value}`;
  if (event.type === "programchange") return `CH${event.channel} Program ${event.program}`;
  if (event.type === "pitchbend") return `CH${event.channel} Pitch Bend ${event.value}`;
  return `MIDI ${event.raw?.map((byte) => byte.toString(16).padStart(2, "0")).join(" ")}`;
}

export function createAllNotesOffMessages(channel = null) {
  const channels = channel ? [channel] : Array.from({ length: 16 }, (_, index) => index + 1);
  return channels.map((ch) => [0xb0 + (ch - 1), 123, 0]);
}

export function transformMidiEvent(event, { transpose = 0, outputChannel = null, split = null } = {}) {
  if (!event || !["noteon", "noteoff"].includes(event.type)) return event;
  if (split?.enabled) {
    const inLower = event.note <= Number(split.note || 59);
    if ((split.zone === "lower" && !inLower) || (split.zone === "upper" && inLower)) return null;
  }
  const channel = outputChannel ? Number(outputChannel) : event.channel;
  const note = Math.max(0, Math.min(127, event.note + Number(transpose || 0)));
  return { ...event, channel, note, raw: [event.type === "noteon" ? 0x90 + channel - 1 : 0x80 + channel - 1, note, event.velocity || 0] };
}

