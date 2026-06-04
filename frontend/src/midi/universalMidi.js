export function parseMidiMessage(message) {
  const [status, data1, data2] = message.data;

  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;

  if (command === 0x80) {
    return {
      type: 'noteoff',
      channel,
      note: data1,
      velocity: data2
    };
  }

  if (command === 0x90) {
    return {
      type: data2 === 0 ? 'noteoff' : 'noteon',
      channel,
      note: data1,
      velocity: data2
    };
  }

  if (command === 0xb0) {
    return {
      type: 'cc',
      channel,
      controller: data1,
      value: data2
    };
  }

  if (command === 0xc0) {
    return {
      type: 'programchange',
      channel,
      program: data1
    };
  }

  if (command === 0xd0) {
    return {
      type: 'aftertouch',
      channel,
      pressure: data1
    };
  }

  if (command === 0xe0) {
    const value = ((data2 << 7) + data1) - 8192;

    return {
      type: 'pitchbend',
      channel,
      value
    };
  }

  if (status === 0xf0) {
    return {
      type: 'sysex',
      raw: Array.from(message.data)
    };
  }

  return {
    type: 'unknown',
    raw: Array.from(message.data)
  };
}

export function mapMidiToAction(event, profile) {
  if (!profile) {
    return {
      action: null,
      control: null,
      event
    };
  }

  let control = null;

  if (event.type === 'noteon') {
    control = profile?.mappings?.notes?.[String(event.note)];
  }

  if (event.type === 'cc') {
    control = profile?.mappings?.cc?.[String(event.controller)];
  }

  if (event.type === 'programchange') {
    control =
      profile?.mappings?.programChange?.[String(event.program)] ||
      profile?.mappings?.programChange?.['*'];
  }

  if (event.type === 'pitchbend') {
    control = profile?.mappings?.pitchBend;
  }

  if (event.type === 'aftertouch') {
    control = profile?.mappings?.aftertouch;
  }

  const action = control ? profile?.actions?.[control] : null;

  return {
    event,
    control,
    action
  };
}

export async function requestMidiAccess({ sysex = false } = {}) {
  if (!navigator.requestMIDIAccess) {
    throw new Error('Web MIDI API is not supported in this browser.');
  }

  return await navigator.requestMIDIAccess({ sysex });
}

export function getMidiInputs(midiAccess) {
  return Array.from(midiAccess.inputs.values()).map(input => ({
    id: input.id,
    name: input.name,
    manufacturer: input.manufacturer,
    state: input.state,
    connection: input.connection,
    input
  }));
}

export async function loadControllerProfile(profilePath = '/midi-profiles/generic-midi-controller.json') {
  const response = await fetch(profilePath);

  if (!response.ok) {
    throw new Error('Failed to load MIDI controller profile.');
  }

  return await response.json();
}

export function attachMidiInput(input, profile, callback) {
  input.onmidimessage = message => {
    const event = parseMidiMessage(message);
    const mapped = mapMidiToAction(event, profile);

    callback(mapped);
  };

  return () => {
    input.onmidimessage = null;
  };
}
