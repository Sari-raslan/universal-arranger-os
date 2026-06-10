
class RegistrationMemory {
  constructor(){
    this.slots = {};
  }

  save(slot,state){
    this.slots[slot] = {
      slot,
      state,
      savedAt:Date.now()
    };
    return this.slots[slot];
  }

  load(slot){
    return this.slots[slot] || null;
  }

  list(){
    return {
      ok:true,
      slots:this.slots
    };
  }

  clear(slot){
    delete this.slots[slot];
    return this.list();
  }
}

module.exports = { RegistrationMemory };
