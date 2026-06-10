
class AutomationEngine {
  constructor(){
    this.lanes = [];
  }

  addLane(target, parameter){
    const lane = {
      id:"lane_" + Date.now(),
      target,
      parameter,
      points:[]
    };

    this.lanes.push(lane);

    return lane;
  }

  addPoint(laneId, bar, value){
    const lane = this.lanes.find(l => l.id === laneId);

    if(!lane){
      return { ok:false, error:"Lane not found" };
    }

    const point = {
      bar:Number(bar),
      value,
      time:Date.now()
    };

    lane.points.push(point);

    return {
      ok:true,
      lane
    };
  }

  status(){
    return {
      ok:true,
      module:"automation",
      lanes:this.lanes
    };
  }
}

module.exports = { AutomationEngine };
