export function createTimelineStore({ maxEvents = 2000, captureIntervalMs = 80 } = {}) {
  let state = { recording: false, playing: false, startedAt: 0, events: [] };
  let lastCapture = 0;

  function startRecording(now = performance.now()) {
    state = { ...state, recording: true, startedAt: now, events: [] };
    lastCapture = 0;
    return state;
  }

  function stopRecording() {
    state = { ...state, recording: false };
    return state;
  }

  function capture(type, payload, now = performance.now()) {
    if (!state.recording || state.playing) return null;
    if (type === "audio.analysis" && now - lastCapture < captureIntervalMs) return null;
    if (type === "audio.analysis") lastCapture = now;
    const event = { id: `${Math.round(now)}-${state.events.length}`, time: Math.max(0, now - state.startedAt), type, payload };
    state = { ...state, events: [...state.events, event].slice(-maxEvents) };
    return event;
  }

  function setEvents(events) {
    state = { ...state, events: Array.isArray(events) ? events.slice(-maxEvents) : [] };
    return state;
  }

  function setPlayback(playing) {
    state = { ...state, playing: Boolean(playing) };
    return state;
  }

  function clear() {
    state = { recording: false, playing: false, startedAt: 0, events: [] };
    return state;
  }

  function getState() {
    return state;
  }

  return { startRecording, stopRecording, capture, setEvents, setPlayback, clear, getState };
}

