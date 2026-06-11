import React, { useMemo, useState } from "react";
import "./style.css";

const products = [
  {
    id: "sing",
    name: "UAOS Sing",
    subtitle: "For singers",
    headline: "غنّي فقط… وUAOS يحوّل صوتك إلى أغنية كاملة.",
    bullets: ["Voice upload", "Style selection", "Magic arrangement", "MP3/WAV export"],
    price: "9–15 € / month"
  },
  {
    id: "studio",
    name: "UAOS Studio",
    subtitle: "For creators",
    headline: "استوديو سهل لصنّاع المحتوى والموسيقيين الجدد.",
    bullets: ["Tracks", "Chords", "Mixer", "MIDI/WAV export"],
    price: "19–29 € / month"
  },
  {
    id: "pro",
    name: "UAOS Pro Arranger",
    subtitle: "For professionals",
    headline: "أداة ذكية للعازفين وأصحاب الأورجات.",
    bullets: ["MIDI/USB", "KORG/Yamaha/Roland/Ketron", "Style tools", "Set manager"],
    price: "49–99 € / month"
  }
];

function Nav({ page, setPage }) {
  const items = [
    ["home", "Home"],
    ["sing", "Sing"],
    ["studio", "Studio"],
    ["pro", "Pro Arranger"],
    ["pricing", "Pricing"],
    ["demo", "Demo"],
    ["downloads", "Downloads"]
  ];

  return (
    <nav className="nav">
      <div className="brand">UAOS</div>
      <div className="navItems">
        {items.map(([id, label]) => (
          <button key={id} onClick={() => setPage(id)} className={page === id ? "active" : ""}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Home({ setPage }) {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Universal Arranger OS</p>
        <h1>Sing. Create. Arrange.</h1>
        <p className="lead">
          UAOS منصة موسيقية بثلاث واجهات: للمغني، لصانع المحتوى، وللمحترف الذي يعمل مع الأورجات.
        </p>
        <div className="heroActions">
          <button onClick={() => setPage("sing")}>ابدأ كمغني</button>
          <button onClick={() => setPage("studio")} className="secondary">افتح Studio</button>
          <button onClick={() => setPage("pro")} className="secondary">Pro Arranger</button>
        </div>
      </section>

      <section className="cards">
        {products.map((p) => (
          <article className="card" key={p.id}>
            <p className="tag">{p.subtitle}</p>
            <h2>{p.name}</h2>
            <p>{p.headline}</p>
            <ul>{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            <button onClick={() => setPage(p.id)}>Open {p.name}</button>
          </article>
        ))}
      </section>
    </main>
  );
}

function Sing() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">UAOS Sing</p>
        <h1>للمغني العادي</h1>
        <p className="lead">ارفع صوتك، اختر ستايل، وخلي UAOS يعمل Demo موسيقي جاهز.</p>

        <div className="workflow">
          <div>1. Upload Voice</div>
          <div>2. Choose Style</div>
          <div>3. Generate Arrangement</div>
          <div>4. Export MP3/WAV</div>
        </div>

        <div className="fakeBox">
          <strong>V1 Demo Placeholder</strong>
          <p>هنا لاحقاً نضيف رفع الصوت وتحليل الطبقة والكوردات والتوزيع الذكي.</p>
        </div>
      </section>
    </main>
  );
}

function Studio() {
  const tracks = ["Drums", "Bass", "Chords", "Piano", "Strings", "Lead", "Vocal Guide", "FX"];
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">UAOS Studio</p>
        <h1>لصانع المحتوى ونصف الموسيقي</h1>
        <p className="lead">واجهة سهلة فيها Tracks وMixer وChord Assistant بدون تعقيد DAW كامل.</p>

        <div className="studioGrid">
          {tracks.map((t) => (
            <div className="track" key={t}>
              <span>{t}</span>
              <button>Mute</button>
              <button>Solo</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Pro() {
  const devices = ["KORG", "Yamaha", "Roland", "Ketron"];
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">UAOS Pro Arranger</p>
        <h1>للمحترف وأصحاب الأورجات</h1>
        <p className="lead">MIDI diagnostics، تحويل Styles، إدارة Sets، وProfiles للأجهزة.</p>

        <div className="cards">
          {devices.map((d) => (
            <article className="card small" key={d}>
              <h2>{d}</h2>
              <p>Device profile placeholder</p>
              <button>Scan MIDI</button>
            </article>
          ))}
        </div>

        <div className="fakeBox">
          <strong>Pro Tools</strong>
          <p>Style Converter / Set Manager / SongBook / Sound Mapper / Sampler Integration</p>
        </div>
      </section>
    </main>
  );
}

function Pricing() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Pricing</p>
        <h1>خطط متعددة لكل فئة</h1>
        <div className="cards">
          {products.map((p) => (
            <article className="card" key={p.id}>
              <h2>{p.name}</h2>
              <p>{p.price}</p>
              <ul>{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Demo() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Demo</p>
        <h1>UAOS V1 Demo</h1>
        <p className="lead">هذه صفحة الديمو العامة للإطلاق الأول.</p>
        <div className="fakeBox">
          <p>Demo video / audio preview / generated song examples will be placed here.</p>
        </div>
      </section>
    </main>
  );
}

function Downloads() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Downloads</p>
        <h1>تحميل UAOS</h1>
        <p className="lead">روابط Windows / Android / iOS / Web ستضاف هنا بعد تثبيت النشر.</p>
        <div className="workflow">
          <div>Windows Desktop</div>
          <div>Android APK</div>
          <div>iOS TestFlight</div>
          <div>Web App</div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const routeFromHash = () => window.location.hash.replace("#/", "") || "home";
  const [page, setPageState] = useState(routeFromHash());

  const setPage = (next) => {
    window.location.hash = `/${next}`;
    setPageState(next);
  };

  const screen = useMemo(() => {
    if (page === "sing") return <Sing />;
    if (page === "studio") return <Studio />;
    if (page === "pro") return <Pro />;
    if (page === "pricing") return <Pricing />;
    if (page === "demo") return <Demo />;
    if (page === "downloads") return <Downloads />;
    return <Home setPage={setPage} />;
  }, [page]);

  return (
    <>
      <Nav page={page} setPage={setPage} />
      {screen}
      <footer>UAOS V1 Platform Preview — Sing / Studio / Pro Arranger</footer>
    </>
  );
}
