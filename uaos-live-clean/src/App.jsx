import React, { useState, useEffect, useRef } from 'react';

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
  const micStreamRef = useRef(null);
  const sequencerIntervalRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    let animFrame;
    if (isMicActive) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          micStreamRef.current = stream;
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioCtxRef.current.createAnalyser();
          analyserRef.current.fftSize = 32;
          const source = audioCtxRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);

          const processAudio = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let total = 0;
            for (let i = 0; i < bufferLength; i++) { total += dataArrayRef.current[i]; }
            setMicLevel(total / bufferLength);
            animFrame = requestAnimationFrame(processAudio);
          };
          processAudio();
        }).catch(err => console.error("Mic Error", err));
    } else {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
      setMicLevel(0);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isMicActive]);

  useEffect(() => {
    if (isPlaying) {
      const synthCtx = new (window.AudioContext || window.webkitAudioContext)();
      const intervalMs = (60 / bpm) * 1000 / 2;
      sequencerIntervalRef.current = setInterval(() => {
        const osc = synthCtx.createOscillator();
        const gainNode = synthCtx.createGain();
        osc.type = genre === 'Techno' ? 'sawtooth' : genre === 'Blues' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(tracks[3].freq, synthCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, synthCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, synthCtx.currentTime + 0.15);
        osc.connect(gainNode);
        gainNode.connect(synthCtx.destination);
        osc.start();
        osc.stop(synthCtx.currentTime + 0.15);
      }, intervalMs);
    } else {
      if (sequencerIntervalRef.current) clearInterval(sequencerIntervalRef.current);
    }
    return () => { if (sequencerIntervalRef.current) clearInterval(sequencerIntervalRef.current); };
  }, [isPlaying, bpm, genre]);

  return (
    <div style={{ background: '#020408', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: '#050811', borderBottom: '1px solid #111625' }}>
        <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>UAOS <span style={{ color: '#00f0ff' }}>XENON PRO</span></span>
        <div style={{ display: 'flex', gap: '8px', background: '#000', padding: '5px', borderRadius: '10px' }}>
          {['home', 'pricing', 'ai_core'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#000' :# =========================================================================
#  UAOS V2 - AUTOMATED ZERO-EFFORT ONE-CLICK LAUNCH SCRIPT (2026-06-12)
# =========================================================================

Write-Host "🚀 جاري تشغيل الأتمتة الكاملة وإطلاق المنصة فوراً بدون تدخل يدوي..." -ForegroundColor Magenta

# 1. تنظيف بيئة العمل
Stop-Process -Name "node","electron" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$PROJECT_ROOT = "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $PROJECT_ROOT

# 2. حقن الأكواد الصوتية الحية والكاملة في الواجهة
cd uaos-live-clean
@'
import React, { useState, useEffect, useRef } from 'react';

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
  const micStreamRef = useRef(null);
  const sequencerIntervalRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    let animFrame;
    if (isMicActive) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          micStreamRef.current = stream;
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioCtxRef.current.createAnalyser();
          analyserRef.current.fftSize = 32;
          const source = audioCtxRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);

          const processAudio = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let total = 0;
            for (let i = 0; i < bufferLength; i++) { total += dataArrayRef.current[i]; }
            setMicLevel(total / bufferLength);
            animFrame = requestAnimationFrame(processAudio);
          };
          processAudio();
        }).catch(err => console.error("Mic Error", err));
    } else {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
      setMicLevel(0);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isMicActive]);

  useEffect(() => {
    if (isPlaying) {
      const synthCtx = new (window.AudioContext || window.webkitAudioContext)();
      const intervalMs = (60 / bpm) * 1000 / 2;
      sequencerIntervalRef.current = setInterval(() => {
        const osc = synthCtx.createOscillator();
        const gainNode = synthCtx.createGain();
        osc.type = genre === 'Techno' ? 'sawtooth' : genre === 'Blues' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(tracks[3].freq, synthCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, synthCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, synthCtx.currentTime + 0.15);
        osc.connect(gainNode);
        gainNode.connect(synthCtx.destination);
        osc.start();
        osc.stop(synthCtx.currentTime + 0.15);
      }, intervalMs);
    } else {
      if (sequencerIntervalRef.current) clearInterval(sequencerIntervalRef.current);
    }
    return () => { if (sequencerIntervalRef.current) clearInterval(sequencerIntervalRef.current); };
  }, [isPlaying, bpm, genre]);

  return (
    <div style={{ background: '#020408', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: '#050811', borderBottom: '1px solid #111625' }}>
        <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>UAOS <span style={{ color: '#00f0ff' }}>XENON PRO</span></span>
        <div style={{ display: 'flex', gap: '8px', background: '#000', padding: '5px', borderRadius: '10px' }}>
          {['home', 'pricing', 'ai_core'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#000' : '#64748b', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
              {t === 'ai_core' ? '🎛️ AUDIO STUDIO' : t}
            </button>
          ))}
        </div>
      </nav>
      <div style={{ padding: '40px' }}>
        {tab === 'ai_core' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '30px' }}>
            <div style={{ background: '#070c18', padding: '30px', borderRadius: '20px', border: '1px solid #141f36' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, fontSize: '22px' }}>🎛️ Live Production Console</h2>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: isPlaying ? '#ff0055' : '#00ff66', color: '#000', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: '700', cursor: 'pointer' }}>
                  {isPlaying ? 'STOP⏹️' : 'PLAY🚀'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#02050a', padding: '25px', borderRadius: '16px', height: '260px', alignItems: 'flex-end' }}>
                {tracks.map((track) => {
                  let h = isPlaying ? Math.floor(Math.random() * track.volume) : 5;
                  if (track.id === 6 && isMicActive) h = Math.min(micLevel * 4, 100);
                  return (
                    <div key={track.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '9%' }}>
                      <div style={{ width: '12px', height: '160px', background: '#0a0f1d', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                        <div style={{ height: `${h}%`, width: '100%', background: `linear-gradient(to top, #00ff66, ${track.color})`, transition: 'height 0.05s ease-out' }}></div>
                      </div>
                      <span style={{ fontSize: '8px', color: '#64748b', marginTop: '10px', whiteSpace: 'nowrap' }}>{track.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#070c18', padding: '20px', borderRadius: '20px' }}>
                <h3>🎙️ Audio Lab</h3>
                <button onClick={() => setIsMicActive(!isMicActive)} style={{ width: '100%', padding: '10px', background: isMicActive ? '#ff0055' : '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700' }}>
                  {isMicActive ? "DISCONNECT" : "CONNECT MIC"}
                </button>
              </div>
              <div style={{ background: '#070c18', padding: '20px', borderRadius: '20px' }}>
                <h3>🧠 AI Taste</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  {['Techno', 'Blues', 'Arabic Pop'].map(g => (
                    <button key={g} onClick={() => setGenre(g)} style={{ padding: '8px', background: genre === g ? '#00f0ff' : '#000', color: '#fff', fontSize: '10px' }}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h2>Secure PayPal Checkout Enabled</h2>
            <button onClick={() => window.location.href=`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=ashley.nuremberg@gmail.com&item_name=UAOS_PRO&amount=49&currency_code=EUR`} style={{ padding: '15px 30px', background: '#fff', color: '#000', fontWeight: '700', borderRadius: '8px' }}>⚡ Pay Now via PayPal</button>
          </div>
        )}
      </div>
    </div>
  );
}
