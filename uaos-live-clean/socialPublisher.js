import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [tab, setTab] = useState('ai_core'); // الدخول المباشر للاستوديو للاختبار
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [genre, setGenre] = useState('Techno');
  
  const [tracks, setTracks] = useState([
    { id: 1, name: "Kick Drum", volume: 80, color: "#ff0055" },
    { id: 2, name: "Snare & Hats", volume: 75, color: "#ff5500" },
    { id: 3, name: "Bassline", volume: 85, color: "#00f0ff" },
    { id: 4, name: "Synth Lead", volume: 70, color: "#00ff66" },
    { id: 5, name: "Chords / Piano", volume: 65, color: "#ffff00" },
    { id: 6, name: "Live Vocal Mic", volume: 90, color: "#ff00ff" },
    { id: 7, name: "Percussion", volume: 60, color: "#0070ba" },
    { id: 8, name: "FX Riser", volume: 50, color: "#9900ff" },
    { id: 9, name: "Master Out", volume: 80, color: "#ffffff" }
  ]);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    let animationFrame;
    if (isMicActive) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 32;
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          sourceRef.current.connect(analyserRef.current);
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          
          const updateVisualizer = () => {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) { sum += dataArrayRef.current[i]; }
            setMicLevel(sum / bufferLength);
            animationFrame = requestAnimationFrame(updateVisualizer);
          };
          updateVisualizer();
        }).catch(err => console.error("Mic error:", err));
    } else {
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      setMicLevel(0);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isMicActive]);

  const triggerPayPalCheckout = (plan) => {
    const merchantEmail = "ashley.nuremberg@gmail.com"; 
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(merchantEmail)}&item_name=${encodeURIComponent(plan.name + " - Promo Launch")}&amount=${plan.new}&currency_code=EUR&no_shipping=1`;
    window.location.href = paypalUrl;
  };

  return (
    <div style={{ background: '#020408', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: '#050811', borderBottom: '1px solid #111625' }}>
        <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>UAOS <span style={{ color: '#00f0ff' }}>XENON PRO</span></span>
        <div style={{ display: 'flex', gap: '8px', background: '#000', padding: '5px', borderRadius: '10px' }}>
          {['home', 'pricing', 'ai_core'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#000' : '#64748b', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', cursor: 'pointer' }}>
              {t === 'ai_core' ? '🎛️ AUDIO STUDIO' : t}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ padding: '40px' }}>
        {tab === 'ai_core' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '30px' }}>
            {/* Mixer UI */}
            <div style={{ background: '#070c18', padding: '30px', borderRadius: '20px', border: '1px solid #141f36' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>🎛️ 9-Lane LED Console</h2>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: isPlaying ? '#ff0055' : '#00ff66', color: '#000', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: '700', cursor: 'pointer' }}>
                  {isPlaying ? 'STOP ⏹️' : 'PLAY 🚀'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#02050a', padding: '25px', borderRadius: '16px', height: '300px', alignItems: 'flex-end' }}>
                {tracks.map((track) => {
                  let h = isPlaying ? Math.floor(Math.random() * track.volume) : 5;
                  if (track.id === 6 && isMicActive) h = Math.min(micLevel * 3, 100);
                  return (
                    <div key={track.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '9%' }}>
                      <div style={{ width: '12px', height: '180px', background: '#0a0f1d', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                        <div style={{ height: `${h}%`, width: '100%', background: `linear-gradient(to top, #00ff66, #ffff00, ${track.color})`, transition: 'height 0.08s ease-out' }}></div>
                      </div>
                      <input type="range" min="0" max="100" value={track.volume} onChange={(e) => {
                        const updated = [...tracks]; updated[track.id-1].volume = parseInt(e.target.value); setTracks(updated);
                      }} style={{ width: '60px', margin: '15px 0 5px 0' }} />
                      <span style={{ fontSize: '9px', color: '#64748b', whiteSpace: 'nowrap' }}>{track.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{ background: '#070c18', padding: '25px', borderRadius: '20px', border: '1px solid #141f36' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#00f0ff' }}>🎙️ Audio Lab Mic</h3>
                <button onClick={() => setIsMicActive(!isMicActive)} style={{ width: '100%', padding: '12px', background: isMicActive ? '#ff0055' : '#fff', color: isMicActive ? '#fff' : '#000', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                  {isMicActive ? "🔴 DEACTIVATE MIC" : "🎙️ ACTIVATE MIC LAB"}
                </button>
              </div>
              <div style={{ background: '#070c18', padding: '25px', borderRadius: '20px', border: '1px solid #141f36' }}>
                <h3 style={{ margin: '0 0 15# =========================================================================
#  UAOS V2 - THE ULTIMATE ALL-IN-ONE AUTOMATED ECOSYSTEM (2026-06-12)
# =========================================================================

# 1. تطهير كامل لبيئة النظام وإيقاف أي عمليات معلقة
Write-Host "🧹 1. Clearing memory and destroying stale processes..." -ForegroundColor Red
Stop-Process -Name "node","electron","electron-builder" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# تحديد المسارات الرئيسية
$ROOT_DIR = "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $ROOT_DIR

# 2. إنشاء وحقن سكربت أتمتة السوشيال ميديا (socialPublisher.js) في المجلد الجذري
Write-Host "🤖 2. Injecting Social Media Automation Publisher..." -ForegroundColor Cyan
@'
const axios = require('axios');

const CONFIG = {
    FACEBOOK: { ACCESS_TOKEN: 'YOUR_FB_LONG_LIVED_TOKEN', PAGE_ID: 'YOUR_FB_PAGE_ID' },
    INSTAGRAM: { ACCESS_TOKEN: 'YOUR_IG_ACCESS_TOKEN', ACCOUNT_ID: 'YOUR_IG_BUSINESS_ID' }
};

const adText = `🔮 مستقبلك الموسيقي بدأ الآن... رحبوا بـ Universal Arranger OS (XENON PRO)!\n\nاستوديو متكامل يترجم أفكارك إلى ألحان أسطورية في ثوانٍ؟ 🚀\n🎙️ Live Mic Audio Lab: تتبع حي لطبقة صوتك.\n🎛️ 9-Lane LED Console: خلاط صوتي نيون بـ 9 مسارات تفاعلية.\n🧠 Arranger AI Brain: توليد خطوط إيقاعية تلقائية لـ Techno, Blues, Arabic Pop!\n\n🎁 عرض الإطلاق التاريخي: سجل الآن واحصل على خصم 50% يثبت لـ 3 أشهر كاملة!\n\n🔗 اشترك وابدأ الإنتاج فوراً من هنا: https://universal-arranger-os.vercel.app`;

async function runSocialCampaign() {
    console.log('🚀 [Automation Core] Initiating Social Media Campaign for UAOS...');
    console.log('📝 Loaded Copywriting Text Successfully.');
    console.log('💡 Note: Live API Keys are required inside CONFIG to push directly to production servers.');
}
runSocialCampaign();
