import React, { useState } from "react";

export default function MidiEngine(){
  const [status,setStatus]=useState("Ready");
  const [inputs,setInputs]=useState([]);
  const [outputs,setOutputs]=useState([]);

  async function scan(){
    if(!navigator.requestMIDIAccess){
      setStatus("WebMIDI not supported");
      return;
    }
    try{
      const midi=await navigator.requestMIDIAccess();
      setInputs(Array.from(midi.inputs.values()).map(x=>x.name || "Input"));
      setOutputs(Array.from(midi.outputs.values()).map(x=>x.name || "Output"));
      setStatus("Scan complete");
    }catch(e){
      setStatus("MIDI error: "+e.message);
    }
  }

  return (
    <section style={{padding:20,border:"1px solid #333",borderRadius:14,marginTop:20}}>
      <h2>UAOS MIDI Engine Real</h2>
      <button onClick={scan}>Scan MIDI</button>
      <p>Status: {status}</p>
      <h3>Inputs</h3>
      <ul>{inputs.map((x,i)=><li key={i}>{x}</li>)}</ul>
      <h3>Outputs</h3>
      <ul>{outputs.map((x,i)=><li key={i}>{x}</li>)}</ul>
    </section>
  );
}
