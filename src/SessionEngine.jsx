import React, { useState } from "react";

export default function SessionEngine(){
  const [msg,setMsg]=useState("");

  function save(){
    const data={
      name:"UAOS Session",
      time:new Date().toISOString(),
      version:"V1.8 foundation"
    };
    localStorage.setItem("uaos-session",JSON.stringify(data));
    setMsg("Session saved locally");
  }

  function load(){
    const raw=localStorage.getItem("uaos-session");
    setMsg(raw ? raw : "No session found");
  }

  return (
    <section style={{padding:20,border:"1px solid #333",borderRadius:14,marginTop:20}}>
      <h2>UAOS Session Engine</h2>
      <button onClick={save}>Save Session</button>
      <button onClick={load} style={{marginLeft:10}}>Load Session</button>
      <pre style={{whiteSpace:"pre-wrap"}}>{msg}</pre>
    </section>
  );
}
