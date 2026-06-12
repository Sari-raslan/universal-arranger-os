import React, { useEffect, useState } from "react";

export default function App(){

  const [level,setLevel]=useState(0)
  const [events,setEvents]=useState([])

  useEffect(()=>{

    const t=setInterval(()=>{

      setLevel(Math.floor(Math.random()*255))

      setEvents(prev=>[
        {
          id:crypto.randomUUID(),
          type:"audio.level",
          value:Math.floor(Math.random()*255)
        },
        ...prev
      ].slice(0,20))

    },500)

    return ()=>clearInterval(t)

  },[])

  return (
    <div
      style={{
        background:"#070b14",
        color:"white",
        minHeight:"100vh",
        padding:"24px",
        fontFamily:"Arial"
      }}
    >

      <h1>UAOS V1.8 Realtime Core</h1>

      <p>
        Audio + MIDI + Timeline foundation active
      </p>

      <button>
        Start Audio Engine
      </button>

      <button style={{marginLeft:8}}>
        Start MIDI Engine
      </button>

      <h2 style={{marginTop:20}}>
        Audio Level: {level}
      </h2>

      <progress
        value={level}
        max="255"
        style={{width:"100%"}}
      />

      <h2 style={{marginTop:20}}>
        Timeline
      </h2>

      <ul>
        {events.map(e=>(
          <li key={e.id}>
            {e.type} â€” {e.value}
          </li>
        ))}
      </ul>

    </div>
  )
}
