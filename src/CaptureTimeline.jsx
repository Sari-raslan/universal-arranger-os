$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"

Set-Location $App

Write-Host "UAOS V1.8 CAPTURE TIMELINE" -ForegroundColor Cyan

@'
import React, { useState } from "react";

export default function CaptureTimeline(){
  const [events,setEvents]=useState([]);

  function addAudio(){
    setEvents(e=>[
      {type:"audio",time:new Date().toLocaleTimeString(),data:"voice level / pitch event"},
      ...e
    ]);
  }

  function addMidi(){
    setEvents(e=>[
      {type:"midi",time:new Date().toLocaleTimeString(),data:"note on/off event"},
      ...e
    ]);
  }

  function save(){
    localStorage.setItem("uaos-capture-timeline",JSON.stringify(events));
    alert("Timeline saved");
  }

  function load(){
    const raw=localStorage.getItem("uaos-capture-timeline");
    if(raw) setEvents(JSON.parse(raw));
  }

  function clear(){
    setEvents([]);
  }

  return (
    <section style={{padding:20,border:"1px solid #333",borderRadius:14,marginTop:20}}>
      <h2>UAOS V1.8 Capture Timeline</h2>
      <p>Foundation for Voice-to-MIDI, MIDI capture, arranger intelligence, and session restore.</p>

      <button onClick={addAudio}>Add Audio Event</button>
      <button onClick={addMidi} style={{marginLeft:10}}>Add MIDI Event</button>
      <button onClick={save} style={{marginLeft:10}}>Save Timeline</button>
      <button onClick={load} style={{marginLeft:10}}>Load Timeline</button>
      <button onClick={clear} style={{marginLeft:10}}>Clear</button>

      <table style={{width:"100%",marginTop:20}}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Time</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e,i)=>(
            <tr key={i}>
              <td>{e.type}</td>
              <td>{e.time}</td>
              <td>{e.data}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
