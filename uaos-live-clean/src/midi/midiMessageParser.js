const CHANNEL_MESSAGE_NAMES = Object.freeze({
  0x80: "noteOff",
  0x90: "noteOn",
  0xa0: "polyAftertouch",
  0xb0: "controlChange",
  0xc0: "programChange",
  0xd0: "channelPressure",
  0xe0: "pitchBend",
});

const SYSTEM_MESSAGE_NAMES = Object.freeze({
  0xf8: "clock",
  0xfa: "start",
  0xfb: "continue",
  0xfc: "stop",
  0xfe: "activeSensing",
  0xff: "systemReset",
});

function toMidiByte(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${label} must be a MIDI byte from 0 to 255`);
  }

  return value;
}

export function parseMidiMessage(data, receivedAt = 0) {
  if (!data || typeof data.length !== "number" || data.length === 0) {
    throw new TypeError("MIDI data is required");
  }

  const bytes = Array.from(data, (value, index) =>
    toMidiByte(Number(value), `byte ${index}`),
  );

  const status = bytes[0];

  if (status >= 0xf8) {
    return {
      type: SYSTEM_MESSAGE_NAMES[status] || "systemRealtime",
      status,
      channel: null,
      data1: bytes[1] ?? null,
      data2: bytes[2] ?? null,
      bytes,
      receivedAt,
    };
  }

  const command = status & 0xf0;
  const channel = status & 0x0f;
  const data1 = bytes[1] ?? 0;
  const data2 = bytes[2] ?? 0;

  let type = CHANNEL_MESSAGE_NAMES[command] || "unknown";

  if (type === "noteOn" && data2 === 0) {
    type = "noteOff";
  }

  if (type === "pitchBend") {
    return {
      type,
      status,
      command,
      channel,
      data1,
      data2,
      value14: (data2 << 7) | data1,
      centeredValue: ((data2 << 7) | data1) - 8192,
      bytes,
      receivedAt,
    };
  }

  return {
    type,
    status,
    command,
    channel,
    data1,
    data2,
    note: type === "noteOn" || type === "noteOff" || type === "polyAftertouch"
      ? data1
      : null,
    velocity: type === "noteOn" || type === "noteOff" ? data2 : null,
    controller: type === "controlChange" ? data1 : null,
    value: type === "controlChange" ? data2 : null,
    program: type === "programChange" ? data1 : null,
    pressure:
      type === "polyAftertouch" || type === "channelPressure"
        ? data2 || data1
        : null,
    bytes,
    receivedAt,
  };
}

export function isPanicController(controller) {
  return controller === 120 || controller === 123;
}

export function isSustainController(controller) {
  return controller === 64;
}

export function matchesMidiChannel(message, selectedChannel) {
  if (selectedChannel === "all" || selectedChannel == null) {
    return true;
  }

  return message.channel === Number(selectedChannel);
}

export function formatMidiEvent(message) {
  const channelText =
    message.channel == null ? "system" : `ch ${message.channel + 1}`;

  if (message.type === "noteOn") {
    return `Note On ${message.note} vel ${message.velocity} آ· ${channelText}`;
  }

  if (message.type === "noteOff") {
    return `Note Off ${message.note} آ· ${channelText}`;
  }

  if (message.type === "controlChange") {
    return `CC ${message.controller} = ${message.value} آ· ${channelText}`;
  }

  if (message.type === "pitchBend") {
    return `Pitch Bend ${message.centeredValue} آ· ${channelText}`;
  }

  return `${message.type} آ· ${channelText}`;
}