
const WebSocket = require("ws");

class RealtimeBus {
constructor(server){
this.clients = [];
this.events = [];
this.wss = new WebSocket.Server({ server });

```
this.wss.on("connection",(ws)=>{
  this.clients.push(ws);

  ws.send(JSON.stringify({
    type:"uaos-connected",
    ok:true,
    time:Date.now()
  }));

  ws.on("message",(message)=>{
    this.events.push({
      type:"client-message",
      message:String(message),
      time:Date.now()
    });
  });

  ws.on("close",()=>{
    this.clients = this.clients.filter(c => c !== ws);
  });
});
```

}

broadcast(type,data={}){
const payload = {
type,
data,
time:Date.now()
};

```
const text = JSON.stringify(payload);

this.events.push(payload);

for(const client of this.clients){
  try{
    client.send(text);
  }catch{}
}

return payload;
```

}

status(){
return {
ok:true,
module:"realtime",
clients:this.clients.length,
recentEvents:this.events.slice(-20)
};
}
}

module.exports = { RealtimeBus };
