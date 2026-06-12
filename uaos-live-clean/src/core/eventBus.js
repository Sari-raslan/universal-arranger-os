export function createEventBus() {
  const listeners = new Map();

  function on(type, handler) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);
    return () => off(type, handler);
  }

  function off(type, handler) {
    listeners.get(type)?.delete(handler);
  }

  function once(type, handler) {
    const unsubscribe = on(type, (event) => {
      unsubscribe();
      handler(event);
    });
    return unsubscribe;
  }

  function emit(type, payload = {}) {
    const event = {
      type,
      payload,
      timestamp: performance?.now?.() ?? Date.now(),
      isoTime: new Date().toISOString()
    };
    for (const handler of listeners.get(type) || []) handler(event);
    for (const handler of listeners.get("*") || []) handler(event);
    return event;
  }

  function clear() {
    listeners.clear();
  }

  return { on, off, once, emit, clear };
}

export const eventBus = createEventBus();

