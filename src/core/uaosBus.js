export class UAOSBus {
  constructor(){
    this.handlers = {};
    this.events = [];
  }
  on(type, fn){
    if(!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(fn);
  }
  emit(type, payload = {}){
    const ev = {
      id: crypto.randomUUID(),
      type,
      payload,
      time: performance.now(),
      ts: Date.now()
    };
    this.events.push(ev);
    (this.handlers[type] || []).forEach(fn => fn(ev));
    (this.handlers["*"] || []).forEach(fn => fn(ev));
    return ev;
  }
}
export const uaosBus = new UAOSBus();
