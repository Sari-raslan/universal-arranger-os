export function attachRealtime(wss, state) {
  wss.on("connection", ws => {
    ws.send(JSON.stringify({ type: "connected", state }));

    ws.on("message", raw => {
      let msg = {};
      try { msg = JSON.parse(raw); } catch {}

      if (msg.type === "section") state.section = msg.value;
      if (msg.type === "tempo") state.tempo = msg.value;
      if (msg.type === "chord") state.chord = msg.value;

      const update = JSON.stringify({ type: "state", state });

      for (const client of wss.clients) {
        if (client.readyState === 1) client.send(update);
      }
    });
  });
}
