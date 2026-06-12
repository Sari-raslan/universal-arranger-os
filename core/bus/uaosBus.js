export class UAOSBus {
  constructor(){ this.handlers = {}; this.events = []; }
  on(type, fn){ (this.handlers[type] ||= []).push(fn); }
  emit(type, payload = {}) {
    const ev = { type, payload, time: performance.now(), ts: Date.now() };
    this.events.push(ev);
    (this.handlers[type] || []).forEach(fn => fn(ev));
    return ev;
  }
  all(){ return this.events; }
}
export const uaosBus = new UAOSBus();
