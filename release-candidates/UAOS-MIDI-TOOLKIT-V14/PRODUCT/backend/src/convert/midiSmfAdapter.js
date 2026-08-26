/**
 * Public Standard MIDI File (SMF) adapter.
 * Recovers proven MThd/MTrk inspection from the Keyboard Manager MIDI parser
 * and adds note-event READ plus in-memory CONVERT_FROM_UAOS_IR.
 * Not a proprietary writer. Not hardware verified.
 */

function readVarLen(buffer, start, end) {
  let value = 0;
  let cursor = start;
  for (let i = 0; i < 4 && cursor < end; i += 1) {
    const byte = buffer[cursor++];
    value = (value << 7) + (byte & 0x7f);
    if ((byte & 0x80) === 0) break;
  }
  return { value, next: cursor };
}

function writeVarLen(value) {
  let v = Math.max(0, value) >>> 0;
  const bytes = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return Buffer.from(bytes);
}

export function parseMidiSmf(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 14 || buffer.subarray(0, 4).toString("ascii") !== "MThd") {
    return { ok: false, errorCode: "NOT_MIDI", validHeader: false };
  }
  const headerLength = buffer.readUInt32BE(4);
  const format = buffer.readUInt16BE(8);
  const trackCount = buffer.readUInt16BE(10);
  const divisionRaw = buffer.readUInt16BE(12);
  const ppq = divisionRaw < 0x8000 ? divisionRaw : null;
  let offset = 8 + headerLength;
  let notes = 0;
  let controllers = 0;
  let programChanges = 0;
  let tempoEvents = 0;
  let sysexEvents = 0;
  const noteEvents = [];
  const open = new Map();

  for (let track = 0; track < trackCount && offset + 8 <= buffer.length; track += 1) {
    if (buffer.subarray(offset, offset + 4).toString("ascii") !== "MTrk") break;
    const length = buffer.readUInt32BE(offset + 4);
    const end = Math.min(buffer.length, offset + 8 + length);
    let cursor = offset + 8;
    let runningStatus = null;
    let tick = 0;
    while (cursor < end) {
      const delta = readVarLen(buffer, cursor, end);
      cursor = delta.next;
      tick += delta.value;
      let status = buffer[cursor++];
      if (status < 0x80) {
        cursor -= 1;
        status = runningStatus;
      } else if (status < 0xf0) {
        runningStatus = status;
      }
      if (status === 0xff) {
        const type = buffer[cursor++];
        const len = readVarLen(buffer, cursor, end);
        cursor = len.next + len.value;
        if (type === 0x51) tempoEvents += 1;
      } else if (status === 0xf0 || status === 0xf7) {
        const len = readVarLen(buffer, cursor, end);
        cursor = len.next + len.value;
        sysexEvents += 1;
      } else if (status >= 0x80 && status <= 0xef) {
        const event = status & 0xf0;
        const channel = status & 0x0f;
        const size = event === 0xc0 || event === 0xd0 ? 1 : 2;
        if (cursor + size > end) break;
        const d1 = buffer[cursor];
        const d2 = size === 2 ? buffer[cursor + 1] : 0;
        if (event === 0x90 && d2 > 0) {
          notes += 1;
          open.set(`${channel}:${d1}`, { midi: d1, startTick: tick, velocity: d2, channel });
        } else if (event === 0x80 || (event === 0x90 && d2 === 0)) {
          const key = `${channel}:${d1}`;
          const started = open.get(key);
          if (started) {
            noteEvents.push({
              midi: started.midi,
              startTick: started.startTick,
              durationTicks: Math.max(1, tick - started.startTick),
              velocity: started.velocity,
              channel: started.channel
            });
            open.delete(key);
          }
        }
        if (event === 0xb0) controllers += 1;
        if (event === 0xc0) programChanges += 1;
        cursor += size;
      } else {
        break;
      }
    }
    for (const started of open.values()) {
      noteEvents.push({
        midi: started.midi,
        startTick: started.startTick,
        durationTicks: Math.max(1, tick - started.startTick),
        velocity: started.velocity,
        channel: started.channel
      });
    }
    open.clear();
    offset = end;
  }

  return {
    ok: true,
    validHeader: true,
    headerLength,
    format,
    trackCount,
    division: divisionRaw,
    ppq,
    notes,
    noteEvents,
    controllers,
    programChanges,
    tempoEvents,
    sysexEvents,
    level: "READ"
  };
}

export function encodeMidiSmf({ noteEvents = [], ppq = 480, tempoBpm = 120 } = {}) {
  const events = [];
  for (const note of noteEvents) {
    const start = Math.max(0, Number(note.startTick) || 0);
    const dur = Math.max(1, Number(note.durationTicks) || ppq);
    const midi = Math.max(0, Math.min(127, Number(note.midi) || 60));
    const vel = Math.max(1, Math.min(127, Number(note.velocity) || 80));
    const ch = Math.max(0, Math.min(15, Number(note.channel) || 0));
    events.push({ tick: start, bytes: Buffer.from([0x90 | ch, midi, vel]) });
    events.push({ tick: start + dur, bytes: Buffer.from([0x80 | ch, midi, 0x40]) });
  }
  events.sort((a, b) => a.tick - b.tick || a.bytes[0] - b.bytes[0]);

  const microseconds = Math.round(60000000 / (tempoBpm || 120));
  const chunks = [writeVarLen(0), Buffer.from([0xff, 0x51, 0x03, (microseconds >> 16) & 0xff, (microseconds >> 8) & 0xff, microseconds & 0xff])];
  let last = 0;
  for (const ev of events) {
    chunks.push(writeVarLen(ev.tick - last), ev.bytes);
    last = ev.tick;
  }
  chunks.push(writeVarLen(0), Buffer.from([0xff, 0x2f, 0x00]));
  const track = Buffer.concat(chunks);

  const header = Buffer.alloc(14);
  header.write("MThd", 0);
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(1, 10);
  header.writeUInt16BE(ppq, 12);

  const mtrk = Buffer.alloc(8);
  mtrk.write("MTrk", 0);
  mtrk.writeUInt32BE(track.length, 4);
  return Buffer.concat([header, mtrk, track]);
}

export function roundtripMidiPitches(buffer) {
  const parsed = parseMidiSmf(buffer);
  if (!parsed.ok) return parsed;
  const encoded = encodeMidiSmf({ noteEvents: parsed.noteEvents, ppq: parsed.ppq || 480 });
  const again = parseMidiSmf(encoded);
  if (!again.ok) return again;
  const a = parsed.noteEvents.map((n) => n.midi).sort((x, y) => x - y);
  const b = again.noteEvents.map((n) => n.midi).sort((x, y) => x - y);
  const match = a.length === b.length && a.every((v, i) => v === b[i]);
  return {
    ok: match,
    errorCode: match ? undefined : "ROUNDTRIP_PITCH_MISMATCH",
    level: match ? "ROUNDTRIP_VERIFIED" : "CONVERT_FROM_UAOS_IR",
    family: "midi",
    inputNotes: a,
    outputNotes: b,
    hardwareVerified: false,
    musicalQualityClaim: false
  };
}
