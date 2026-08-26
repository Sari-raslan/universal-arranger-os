export class EventBus {
  constructor(){ this.events = []; }
  push(type, payload = {}) {
    const event = { id: Date.now() + Math.random(), type, payload, time: new Date().toISOString() };
    this.events.unshift(event);
    this.events = this.events.slice(0, 100);
    return event;
  }
  list(){ return this.events; }
}