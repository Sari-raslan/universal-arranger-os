import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { ArrangerEngine } from "./src/arranger-engine.js";
import { ChordEngine } from "./src/chord-engine.js";
import { MidiRouter } from "./src/midi-router.js";

const app = express();
app.use(cors());
app.use(express.json());

const arranger = new ArrangerEngine();
const chords = new ChordEngine();
const midi = new MidiRouter();

app.get("/", (req,res)=>res.json({ ok:true, service:"UAOS Backend" }));
app.get("/health", (req,res)=>res.json({ ok:true, phase:"2/3", time:new Date().toISOString() }));
app.get("/devices", (req,res)=>res.json(midi.scan()));
app.post("/arranger/section", (req,res)=>res.json(arranger.setSection(req.body.section)));
app.post("/chord", (req,res)=>res.json(chords.detect(req.body.notes || [])));

const server = app.listen(process.env.PORT || 8080, ()=> {
  console.log("UAOS backend running");
});

const wss = new WebSocketServer({ server });
wss.on("connection", ws => {
  ws.send(JSON.stringify({ ok:true, type:"uaos-connected" }));
  ws.on("message", msg => ws.send(JSON.stringify({ ok:true, echo:String(msg) })));
});