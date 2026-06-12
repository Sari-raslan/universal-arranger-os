import React, { useState, useEffect, useRef } from 'react';
import { UAOS_CORE_ENGINE } from './services/uaosCoreBridge';

export default function App() {
  const [tab, setTab] = useState('ai_core');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [genre, setGenre] = useState('Techno');
  
  const [tracks] = useState([
    { id: 1, name: "Kick Drum (Synth)", volume: 80, color: "#ff0055", freq: 55 },
    { id: 2, name: "Snare & Hats", volume: 75, color: "#ff5500", freq: 250 },
    { id: 3, name: "Bassline Core", volume: 85, color: "#00f0ff", freq: 80 },
    { id: 4, name: "Synth Lead", volume: 70, color: "#00ff66", freq: 440 },
    { id: 5, name: "Chords / Piano", volume: 65, color: "#ffff00", freq: 330 },
    { id: 6, name: "Live Vocal Mic", volume: 90, color: "#ff00ff", freq: 0 },
    { id: 7, name: "Percussion Loop", volume: 60, color: "#0070ba", freq: 600 },
    { id: 8, name: "FX Riser Noise", volume: 50, color: "#9900ff", freq: 1000 },
    { id: 9, name: "Master Out", volume: 80, color: "#ffffff", freq: 0 }
  ]);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sequencerIntervalRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    if (UAOS_CORE_ENGINE.isLinkedToMainOS) {
      console.log("✅ Main UAOS Core System linked successfully to Live Interface!");
    }
  }, []);

  useEffect(() => {
    let animFrame;
    if (isMicActive) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioCtxRef.current.createAnalyser();
          const source = audioCtxRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          const update = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            setMicLevel(dataArray[0] || 0);
            animFrame = requestAnimationFrame(update);
          };
          update();
        }).catch(err => console.error(err));
    } else {
      if (audioCtxRef.current) audioCtxRef.current.close();
      setMicLevel(0);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isMicActive]);

  return (
    <div style={{ background: '#020408', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: '#050811', borderBottom: '1px solid #111625' }}>
        <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>UAOS <span style={{ color: '#00f0ff' }}>XENON PRO</span></span>
        <span style={{ fontSize: '10px', background: '#00ff66', color: '#000', padding: '4px 10px', borderRadius: '4px', fontWeight: '700' }}>🔗 MAIN OS LINKED</span>
      </nav>
      <div style={{ padding: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '30px' }}>
          <div style={{ background: '#070c18', padding: '30px', borderRadius: '20px', border: '1px solid #141f36' }}>
            <h2 style={{ margin: 0, fontSize: '22px', marginBottom: '20px' }}>🎛️ Connected Master Console ({genre})</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#02050a', padding: '25px', borderRadius: '16px', height: '200px', alignItems: 'flex-end' }}>
              {tracks.map((track) => {
                let h = isPlaying ? Math.floor(Math.random() * track.volume) : 5;
                if (track.id === 6 && isMicActive) h = Math.min(micLevel * 4, 100);
                return (
                  <div key={track.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '9%' }}>
                    <div style={{ width: '10px', height: '120px', background: '#0a0f1d', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                      <div style={{ height: `${h}%`, width: '100%', background: track.color }}></div>
                    </div>
                    <span style={{ fontSize: '8px', color: '#64748b', marginTop: '10px' }}>{track.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: '#070c18', padding: '25px', borderRadius: '20px' }}>
            <h3>🎙️ Audio Lab Control</h3>
            <button onClick={() => setIsMicActive(!isMicActive)} style={{ width: '100%', padding: '12px', background: isMicActive ? '#ff0055' : '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              {isMicActive ? "DISCONNECT MIC" : "CONNECT MASTER MIC"}
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: '100%', padding: '12px', background: isPlaying ? '#ff0055' : '#00ff66', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
              {isPlaying ? "STOP SEQUENCE" : "RUN UAOS ENGINE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
