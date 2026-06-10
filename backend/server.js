const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8090;

app.use(cors());
app.use(express.json());

const runtime = {
  core: {
    version: "0.1.0-alpha",
    status: "active"
  },
  midi: {
    loaded: true,
    routing: "foundation"
  },
  arranger: {
    loaded: true,
    transitions: "foundation"
  },
  sampler: {
    loaded: true,
    playback: "foundation"
  },
  hardware: {
    loaded: true,
    devices: []
  },
  ai: {
    loaded: true,
    analysis: "pending"
  }
};

app.get("/", (req,res)=>{
  res.json({
    ok:true,
    app:"UAOS HyperStation",
    runtime:"Core Runtime Alpha"
  });
});

app.get("/health",(req,res)=>{
  res.json({
    ok:true,
    backend:true,
    timestamp:new Date().toISOString()
  });
});

app.get("/runtime",(req,res)=>{
  res.json(runtime);
});

app.get("/runtime/modules",(req,res)=>{
  res.json(Object.keys(runtime));
});

app.get("/api/status",(req,res)=>{
  res.json({
    ok:true,
    runtime
  });
});

app.listen(PORT, ()=>{
  console.log("UAOS Runtime Backend => http://localhost:" + PORT);
});
