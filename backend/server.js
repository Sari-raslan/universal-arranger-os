const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8090;
const ROOT = path.resolve(__dirname, "..");

app.use(cors());
app.use(express.json());

function exists(p){ return fs.existsSync(path.join(ROOT,p)); }

app.get("/", (_,res)=>res.json({
  app:"UAOS Universal Arranger OS",
  version:"1.0.0",
  status:"running",
  routes:["/health","/scan","/api/status"]
}));

app.get("/health", (_,res)=>res.json({
  ok:true,
  backend:true,
  time:new Date().toISOString()
}));

app.get("/scan", (_,res)=>{
  const state = {
    repo: ROOT,
    frontend: exists("frontend/package.json"),
    backend: exists("backend/package.json"),
    electron: exists("electron/main.js"),
    reports: exists("reports"),
    scripts: exists("scripts"),
    packageRoot: exists("package.json")
  };
  res.json({ok:true,state});
});

app.get("/api/status", (_,res)=>res.json({
  ok:true,
  project:"UAOS V1",
  modules:{
    arranger:true,
    midi_engine:"v1 placeholder",
    media_pages:true,
    frontend:true,
    backend:true,
    monitor:true
  }
}));

app.listen(PORT, ()=>{
  console.log(`UAOS backend running on http://localhost:${PORT}`);
});
