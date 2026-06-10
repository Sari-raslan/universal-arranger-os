const WebSocket = require("../backend/node_modules/ws");

class RealtimeBus {
  constructor(server){
    this.clients = [];
    this.events = [];
    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", (ws) => {
      this.clients.push(ws);

      ws.send(JSON.stringify({
        type: "uaos-connected",
        ok: true,
        time: Date.now()
      }));

      ws.on("message", (msg) => {
        this.events.push({
          type: "client-message",
          message: String(msg),
          time: Date.now()
        });
      });

      ws.on("close", () => {
        this.clients = this.clients.filter(c => c !== ws);
      });
    });
  }

  broadcast(type, data = {}){
    const payload = { type, data, time: Date.now() };

    for(const client of this.clients){
      try {
        client.send(JSON.stringify(payload));
      } catch {}
    }

    this.events.push(payload);
    return payload;
  }

  status(){
    return {
      ok: true,
      module: "realtime",
      clients: this.clients.length,
      recentEvents: this.events.slice(-20)
    };
  }
}

module.exports = { RealtimeBus };
