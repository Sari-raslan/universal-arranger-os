import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

function App(){
  const [status,setStatus]=useState(null);

  useEffect(()=>{
    fetch("http://localhost:8090/api/status")
      .then(r=>r.json())
      .then(setStatus)
      .catch(()=>setStatus({ok:false,error:"Backend not connected"}));
  },[]);

  return (
    <main className="app">
      <section className="hero">
        <h1>UAOS V1</h1>
        <p>Universal Arranger OS — Launch Build</p>
        <div className="grid">
          <div>Arranger Sections</div>
          <div>MIDI Engine</div>
          <div>Media Pages</div>
          <div>Agent Monitor</div>
          <div>Style Converter</div>
          <div>DAW / Library Roadmap</div>
        </div>
        <pre>{JSON.stringify(status,null,2)}</pre>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
