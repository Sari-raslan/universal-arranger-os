import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#020617,#07111f,#0b1b2d)",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "48px"
    }}>
      <section style={{maxWidth:"1000px",margin:"0 auto"}}>
        <h1 style={{fontSize:"56px",marginBottom:"12px"}}>UAOS</h1>
        <h2 style={{fontSize:"32px",color:"#22d3ee"}}>Universal Arranger OS is Live</h2>
        <p style={{fontSize:"20px",lineHeight:"1.6",color:"#cbd5e1"}}>
          AI-powered arranger workstation for MIDI, chords, style runtime,
          DAW workflow, Oriental libraries, and .uaos-pack keyboard runtime.
        </p>

        <div style={{display:"flex",gap:"16px",flexWrap:"wrap",marginTop:"28px"}}>
          <a href="./launch/payment.html" style={buttonStyle}>Creator / Pro Premium</a>
          <a href="./status-ar.html" style={buttonStyle}>Arabic Status</a>
          <a href="#runtime" style={buttonStyle}>Runtime Engine</a>
        </div>

        <div id="runtime" style={{
          marginTop:"50px",
          padding:"28px",
          border:"1px solid rgba(34,211,238,.35)",
          borderRadius:"18px",
          background:"rgba(15,23,42,.7)"
        }}>
          <h3 style={{fontSize:"28px",color:"#67e8f9"}}>Current Build</h3>
          <ul style={{fontSize:"18px",lineHeight:"1.9"}}>
            <li>✅ React / Vite runtime working</li>
            <li>✅ GitHub Pages live</li>
            <li>✅ SPA fallback enabled</li>
            <li>✅ Feel Sampler scaffold</li>
            <li>✅ Keyboard Runtime / .uaos-pack direction</li>
            <li>✅ KORG / Yamaha / Roland / Ketron roadmap</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

const buttonStyle = {
  display: "inline-block",
  padding: "14px 20px",
  borderRadius: "12px",
  background: "linear-gradient(90deg,#2563eb,#06b6d4)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold"
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
