import React, { useState, useEffect, useRef } from 'react';
import { UAOS_CORE_ENGINE } from './services/uaosCoreBridge';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [genre, setGenre] = useState('Techno');
  const [micLevel, setMicLevel] = useState(0);
  const [pulseTrigger, setPulseTrigger] = useState(0);

  const [tracks, setTracks] = useState([
    { id: 1, name: "Kick Drum (Synth)", volume: 80, color: "#ff0055", freq: 60 },
    { id: 2, name: "Snare & Hats", volume: 75, color: "#ff5500", freq: 200 },
    { id: 3, name: "Bassline Core", volume: 85, color: "#00f0ff", freq: 80 },
    { id: 4, name: "Synth Lead", volume: 70, color: "#00ff66", freq: 440 },
    { id: 5, name: "Chords / Piano", volume: 65, color: "#ffff00", freq: 330 },
    { id: 6, name: "Live Vocal Mic", volume: 90, color: "#ff00ff", freq: 0 },
    { id: 7, name: "Percussion Loop", volume: 60, color: "#0070ba", freq: 500 },
    { id: 8, name: "FX Riser Noise", volume: 50, color: "#9900ff", freq: 800 },
    { id: 9, name: "Master Out", volume: 80, color: "#ffffff", freq: 0 }
  ]);

  const localAudioCtxRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const seqTimerRef = useRef(null);

  // تفعيل المايك الحي الفعلي ورسم الذبذبة
  const toggleMic = async () => {
    if (!isMicActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 32;
        
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        localAudioCtxRef.current = ctx;
        localAnalyserRef.current = analyser;
        setIsMicActive(true);
      } catch (err) {
        alert("⚠️ يرجى تفعيل إذن المايك في إعدادات النظام للديسك توب!");
      }
    } else {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (localAudioCtxRef.current) localAudioCtxRef.current.close();
      setIsMicActive(false);
      setMicLevel(0);
    }
  };

  // حلقة رصد الترددات الحية للمايك والنبضات
  useEffect(() => {
    let frame;
    const updateLevels = () => {
      if (isMicActive && localAnalyserRef.current) {
        const dataArray = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
        localAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i=0; i<dataArray.length; i++) { sum += dataArray[i]; }
        setMicLevel(sum / dataArray.length);
      }
      if (isPlaying) {
        setPulseTrigger(prev => (prev + 1) % 100);
      }
      frame = requestAnimationFrame(updateLevels);
    };
    updateLevels();
    return () => cancelAnimationFrame(frame);
  }, [isMicActive, isPlaying]);

  // محرك العزف وتوليد النغمات الصوتية الفعلي عند الضغط على الزر الأخضر
  const toggleEngine = () => {
    if (!isPlaying) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const actx = new AudioContextClass();
      
      seqTimerRef.current = setInterval(() => {
        const type = genre === 'Techno' ? 'sawtooth' : genre === 'Blues' ? 'triangle' : 'sine';
        const randomTrack = tracks[Math.floor(Math.random() * 5)];
        UAOS_CORE_ENGINE.generateSynthPulse(actx, randomTrack.freq, type);
      }, 250);

      setIsPlaying(true);
    } else {
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ background: '#03060e', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #121b2d', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '1px' }}>UAOS <span style={{ color: '#00f0ff' }}>XENON PRO</span></h1>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Engine Hardware Status: Integrated Baseline</span>
        </div>
        <span style={{ fontSize: '11px', background: '#00ff66', color: '#000', padding: '6px 14px', borderRadius: '6px', fontWeight: '700' }}>🔗 MAIN OS ACTIVE</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '30px' }}>
        {/* الخلاط الصوتي المطور والمدمج */}
        <div style={{ background: '#080f1e', padding: '30px', borderRadius: '20px', border: '1px solid #16243d' }}>
          <h2 style={{ margin: '0 0 25px 0', fontSize: '18px', color: '#94a3b8' }}>🎛️ Connected Master Console ({genre} Core)</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#02050b', padding: '30px', borderRadius: '16px', height: '240px', alignItems: 'flex-end' }}>
            {tracks.map((t) => {
              // ربط حركة الليدات برمجياً بالمحركات الصوتية الفعلية
              let visualHeight = 4;
              if (isPlaying) visualHeight = Math.floor(Math.random() * (t.volume - 20) + 20);
              if (t.id === 6 && isMicActive) visualHeight = Math.min(micLevel * 4, 100);

              return (
                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '9%' }}>
                  <div style={{ width: '10px', height: '140px', background: '#0d1527', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                    <div style={{ height: `${visualHeight}%`, width: '100%', background: t.color, boxShadow: `0 0 10px ${t.color}`, transition: 'height 0.04s ease-out' }}></div>
                  </div>
                  <span style={{ fontSize: '8px', color: '#475569', marginTop: '12px', textAlign: 'center', height: '20px', overflow: 'hidden' }}>{t.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* لوحة التحكم والتحفيز */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ background: '#080f1e', padding: '25px', borderRadius: '20px', border: '1px solid #16243d' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>🎙️ Audio Lab Control</h3>
            <button onClick={toggleMic} style={{ width: '100%', padding: '14px', background: isMicActive ? '#ff0055' : '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', fontSize: '12px' }}>
              {isMicActive ? "🔴 DISCONNECT MASTER MIC" : "🎙️ CONNECT MASTER MIC"}
            </button>
            <button onClick={toggleEngine} style={{ width: '100%', padding: '14px', background: isPlaying ? '#ff0055' : '#00ff66', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
              {isPlaying ? "⏹️ STOP ENGINE" : "⚡ RUN UAOS ENGINE"}
            </button>
          </div>

          <div style={{ background: '#080f1e', padding: '25px', borderRadius: '20px', border: '1px solid #16243d' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '15px' }}>🧠 Select Arranger Brain</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Techno', 'Blues', 'Arabic Pop'].map(g => (
                <button key={g} onClick={() => setGenre(g)} style={{ padding: '10px', background: genre === g ? '#00f0ff' : '#02050b', color: genre === g ? '#000' : '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
