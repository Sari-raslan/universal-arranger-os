import React, { useState } from 'react';

export default function App() {
  const [tab, setTab] = useState('home');
  const [isPlaying, setIsPlaying] = useState(false);

  const plans = [
    { name: "UAOS Sing", old: "15", new: "9", desc: "تتبع طبقة الصوت والتقاط الإشارات للمغنين وصناع المحتوى." },
    { name: "UAOS Studio", old: "29", new: "19", desc: "مختبر الصوت المتكامل وتسجيل الخط الزمني للمنتجين." },
    { name: "UAOS Pro Arranger", old: "99", new: "49", desc: "محرك التوزيع ذو الـ 9 مسارات والتحكم الحي الكامل لأجهزة الـ MIDI." }
  ];

  return (
    <div style={{ background: '#03050a', color: '#fff', minHeight: '100vh', fontFamily: '"Segoe UI", sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @keyframes ledBreathe { 0% { box-shadow: 0 0 8px rgba(0,240,255,0.2); } 100% { box-shadow: 0 0 22px rgba(0,240,255,0.6); } }
        .led-breathing { animation: ledBreathe 3s ease-in-out infinite alternate; border: 1px solid rgba(0,240,255,0.2); }
        .btn-neon { background: #fff; color: #000; border: none; font-weight: 700; transition: 0.2s; cursor: pointer; }
        .btn-neon:hover { background: #00f0ff; box-shadow: 0 0 15px #00f0ff; }
      `}</style>

      {/* شريط الملاحة العلوي المتناسق (أبيض وأسود وزينون) */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#070a12', borderBottom: '1px solid #111522' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00f0ff', box-shadow: '0 0 10px #00f0ff' }}></div>
          <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '2px' }}>UAOS <span style={{ color: '#00f0ff' }}>XENON</span></span>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: '#000', padding: '4px', borderRadius: '10px' }}>
          {['home', 'pricing', 'ai_core'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#000' : '#64748b', border: 'none', padding: '10px 22px', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>
      </nav>

      {/* مساحة العرض المركزية */}
      <div style={{ padding: '60px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* صفحة الأسعار الشهرية وعرض الـ 3 أشهر */}
        {tab === 'pricing' ? (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#00f0ff', border: '1px solid #00f0ff', padding: '6px 18px', borderRadius: '20px', background: 'rgba(0,240,255,0.02)', fontWeight: '700' }}>
              📢 بمناسبة الافتتاح: سجل خلال 3 أيام واحصل على الخصم لمدة 3 أشهر كاملة!
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginTop: '40px' }}>
              {plans.map((p, i) => (
                <div key={i} className="led-breathing" style={{ background: '#090d16', padding: '35px', borderRadius: '24px', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '15px' }}>{p.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px' }}>
                    <span style={{ color: '#475569', textDecoration: 'line-through', fontSize: '16px' }}>{p.old} EUR</span>
                    <span style={{ color: '#00ff66', fontSize: '32px', fontWeight: '800' }}>{p.new} EUR</span>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>/ شهرياً</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '25px' }}>{p.desc}</p>
                  <div style={{ fontSize: '11px', color: '#475569', padding: '10px', background: '#03050a', borderRadius: '8px', marginBottom: '20px' }}>
                    * يستمر السعر المخفض طوال الـ 90 يوماً الأولى، ثم يعود تلقائياً للسعر الرسمي الشائع.
                  </div>
                  <button className="btn-neon" style={{ width: '100%', padding: '14px', borderRadius: '10px', fontWeight: '900' }}>تفعيل عرض الافتتاح 🚀</button>
                </div>
              ))}
            </div>
          </div>
        ) : tab === 'ai_core' ? (
          /* استوديو الـ AI المرتبط بالأدمغة محلياً */
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
            <div style={{ background: '#090d16', padding: '40px', borderRadius: '24px' }} className="led-breathing">
              <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '800' }}>🎛️ مصفوفة تحكم الـ LED والأدمغة</h2>
              <p style={{ color: '#64748b', fontSize: '13px' }}>محرك سطح المكتب متصل الآن بكافة الـ Agents والملفات المصدريّة للأم بشكل حتمي.</p>
              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ flex: 1, padding: '14px', background: isPlaying ? '#00f0ff' : 'transparent', color: isPlaying ? '#000' : '#fff', border: '1px solid #00f0ff', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  {isPlaying ? 'إيقاف نبض الـ LED ⏹️' : 'تنشيط النبض والإيقاع 🎵'}
                </button>
              </div>
            </div>
            <div style={{ background: '#090d16', padding: '30px', borderRadius: '24px', border: '1px solid #141923' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 10px 0' }}>🧠 حالة الأدمغة والـ Agents</h3>
              <div style={{ color: '#00ff66', fontSize: '13px', fontFamily: 'monospace', background: '#020306', padding: '15px', borderRadius: '10px' }}>
                ● AGENT_AUDIO_ENGINE: CONNECTED<br/>
                ● AGENT_MIDI_ROUTER: ACTIVE<br/>
                ● BRAIN_DETERMINISTIC_CORE: READY
              </div>
            </div>
          </div>
        ) : (
          /* الصفحة الأم الحقيقية مضافاً إليها زر دخول الاستوديو المطور */
          <div style={{ textAlign: 'center', padding: '80px 40px', background: 'radial-gradient(circle at top, #0b1122 0%, #03050a 100%)', borderRadius: '32px', border: '1px solid #111522' }}>
            <h1 style={{ fontSize: '56px', fontWeight: '900', marginBottom: '20px' }}>Universal Arranger OS</h1>
            <p style={{ color: '#64748b', maxWidth: '650px', margin: '0 auto 40px auto', fontSize: '16px', lineHeight: '1.6' }}>
              مساحة العمل الموسيقية الأم لسطح المكتب. تحليل فوري لصوت الميكروفون، مراقبة قنوات الـ MIDI الحية، وتخطيط التوزيع الأوتوماتيكي المعتمد على الأدمغة والـ Agents المحلية.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button style={{ padding: '15px 36px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '700' }}>Open Audio Lab</button>
              <button onClick={() => setTab('ai_core')} style={{ padding: '15px 36px', background: 'transparent', color: '#00f0ff', border: '1px solid #00f0ff', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>دخول الاستوديو والأدمغة 🧠</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
