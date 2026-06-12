import React, { useState, useEffect, useRef } from 'react';
import { UAOS_CORE_ENGINE } from './services/uaosCoreBridge';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [genre, setGenre] = useState('Techno');
  const [micLevel, setMicLevel] = useState(0);
  const [activeMidiNote, setActiveMidiNote] = useState("C4");

  const [tracks] = useState([
    { id: 1, name: "Kick Drum (Synth)", volume: 85, color: "#ff0055", freq: 55 },
    { id: 2, name: "Snare & Hats", volume: 75, color: "#ff5500", freq: 220 },
    { id: 3, name: "Bassline Core", volume: 80, color: "#00f0ff", freq: 73 },
    { id: 4, name: "Synth Lead", volume: 75, color: "#00ff66", freq: 440 },
    { id: 5, name: "Chords / Piano", volume: 70, color: "#ffff00", freq: 330 },
    { id: 6, name: "Live Vocal Mic", volume: 90, color: "#ff00ff", freq: 0 },
    { id: 7, name: "Percussion Loop", volume: 65, color: "#0070ba", freq: 480 },
    { id: 8, name: "FX Riser Noise", volume: 55, color: "#9900ff", freq: 900 },
    { id: 9, name: "Master Out", volume: 80, color: "#ffffff", freq: 0 }
  ]);

  const localAudioCtxRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const seqTimerRef = useRef(null);

  // تشغيل المايك الفعلي وربطه بـ FX Agent لصدى الصوت الاحترافي حياً
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
        
        // تمرير الإشارة الحية داخل الـ Master FX Agent تلقائياً لصوت سينمائي
        const fxNode = UAOS_CORE_ENGINE.applyMasterFX(ctx, source);
        fxNode.connect(analyser);
        analyser.connect(ctx.destination);
        
        localAudioCtxRef.current = ctx;
        localAnalyserRef.current = analyser;
        setIsMicActive(true);
      } catch (err) {
        alert("🎤 يرجى التأكد من تفعيل المايك الداخلي للجهاز!");
      }
    } else {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (localAudioCtxRef.current) localAudioCtxRef.current.close();
      setIsMicActive(false);
      setMicLevel(0);
    }
  };

  // معالجة حركة اليد ليدات الميكسر ومزامنتها مع تشغيل المحركات في الخلفية
  useEffect(() => {
    let frame;
    const loop = () => {
      if (isMicActive && localAnalyserRef.current) {
        const dataArray = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
        localAnalyserRef.current.getByteFrequencyData(dataArray);
        setMicLevel(dataArray[0] || 0);
      }
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [isMicActive]);

  // تشغيل السيكوانسر وتوليد النغمات الفعلي بالتوازي مع اختيار الذوق الموسيقي
  const toggleEngine = () => {
    if (!isPlaying) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const actx = new AudioContextClass();
      
      seqTimerRef.current = setInterval(() => {
        const type = genre === 'Techno' ? 'sawtooth' : genre === 'Blues' ? 'triangle' : 'sine';
        const randomTrack = tracks[Math.floor(Math.random() * 5)];
        
        // استدعاء محرك التوليد الصوتي الفعلي للـ Agent في الخلفية
        UAOS_CORE_ENGINE.generateSynthPulse(actx, randomTrack.freq, type);
        
        // محاكاة عمل معالج الـ MIDI بالتوازي حياً
        const processedNote = UAOS_CORE_ENGINE.processMidiData(60);
        setActiveMidiNote(`C${processedNote === 72 ? '5' : '4'}`);
      }, 200);

      setIsPlaying(true);
    } else {
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ background: '#02050b', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #14213d', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>UAOS <span style={{ color: '#00f0ff' }}>XENON PRO</span></h1>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Multi-Agent Runtime Status: <span style={{ color: '#00ff66' }}>All 3 Agents Armed & Running Parallel</span></span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '11px', background: '#020408', border: '1px solid #00ff66', color: '#00ff66', padding: '6px 14px', borderRadius: '6px', fontWeight: '700' }}>🔗 AGENT CORE ONLINE</span>
          <span style={{ fontSize: '11px', background: '#00ff66', color: '#000', padding: '6px 14px', borderRadius: '6px', fontWeight: '700' }}>🎹 MIDI: {activeMidiNote}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '30px' }}>
        {/* مصفوفة الـ Master Console الاحترافية والمدارة بالكامل */}
        <div style={{ background: '#070c17', padding: '30px', borderRadius: '20px', border: '1px solid #142038' }}>
          <h2 style={{ margin: '0 0 25px 0', fontSize: '18px', color: '#94a3b8' }}>🎛️ Connected Master Console ({genre} Orchestration)</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#010307', padding: '30px', borderRadius: '16px', height: '240px', alignItems: 'flex-end' }}>
            {tracks.map((t) => {
              let visualHeight = 5;
              if (isPlaying) visualHeight = Math.floor(Math.random() * (t.volume - 30) + 30);
              if (t.id === 6 && isMicActive) visualHeight = Math.min(micLevel * 4.5, 100);

              return (
                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '9%' }}>
                  <div style={{ width: '10px', height: '140px', background: '#090f1d', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                    <div style={{ height: `${visualHeight}%`, width: '100%', background: t.color, boxShadow: `0 0 12px ${t.color}`, transition: 'height 0.04s ease-out' }}></div>
                  </div>
                  <span style={{ fontSize: '8px', color: '#475569', marginTop: '12px', textAlign: 'center', height: '20px', overflow: 'hidden', fontWeight: '600' }}>{t.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* لوحة تحكم المهام المتتالية في الاستوديو */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ background: '#070c17', padding: '25px', borderRadius: '20px', border: '1px solid #142038' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#00f0ff' }}>🎙️ Execution Hub</h3>
            <button onClick={toggleMic} style={{ width: '100%', padding: '14px', background: isMicActive ? '#ff0055' : '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', fontSize: '12px' }}>
              {isMicActive ? "🔴 DISCONNECT LIVE MIC (WITH FX)" : "🎙️ CONNECT LIVE MIC (WITH REVERB FX)"}
            </button>
            <button onClick={toggleEngine} style={{ width: '100%', padding: '14px', background: isPlaying ? '#ff0055' : '#00ff66', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
              {isPlaying ? "⏹️ STOP UAOS SEQUENCER" : "⚡ RUN UNIFIED ENGINE & AGENTS"}
            </button>
          </div>

          <div style={{ background: '#070c17', padding: '25px', borderRadius: '20px', border: '1px solid #142038' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '15px' }}>🧠 Select Arranger Brain</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Techno', 'Blues', 'Arabic Pop'].map(g => (
                <button key={g} onClick={() => setGenre(g)} style={{ padding: '10px', background: genre === g ? '#00f0ff' : '#010307', color: genre === g ? '#000' : '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
