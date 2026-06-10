const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8090;

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>res.json({
  ok:true,
  app:"UAOS Universal Arranger OS",
  version:"1.0.0",
  status:"running"
}));

app.get("/health", (req,res)=>res.json({
  ok:true,
  backend:true,
  time:new Date().toISOString()
}));

app.get("/scan", (req,res)=>res.json({
  ok:true,
  scan:true,
  project:"UAOS V1",
  modules:["frontend","backend","monitor","agent-output","reports"]
}));

app.get("/api/status", (req,res)=>res.json({
  ok:true,
  project:"UAOS V1",
  launch:"ready",
  modules:{
    frontend:true,
    backend:true,
    health:true,
    scan:true,
    monitor:true
  }
}));

app.listen(PORT, ()=>{
  console.log("UAOS backend running on http://localhost:" + PORT);
});
