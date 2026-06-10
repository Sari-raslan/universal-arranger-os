
class LivePerformanceState {
  constructor(){
    this.state = "idle";
    this.history = [];
  }

  transition(next){
    const event = {
      from:this.state,
      to:next,
      time:Date.now()
    };
    this.state = next;
    this.history.push(event);
    return this.status();
  }

  status(){
    return {
      ok:true,
      module:"performance",
      state:this.state,
      history:this.history.slice(-20)
    };
  }
}

module.exports = { LivePerformanceState };
