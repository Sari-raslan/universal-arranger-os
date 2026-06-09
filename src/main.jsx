import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <main className="uaos">
      <h1>UAOS  Universal Arranger OS</h1>
      <p>V1 fixed. Phase 2 and Phase 3 launcher ready.</p>
      <nav>
        <a href="/">Home</a>
        <a href="/app">App</a>
        <a href="/media">Media</a>
        <a href="/features">Features</a>
        <a href="/pricing">Pricing</a>
        <a href="/downloads">Downloads</a>
        <a href="/demo">Demo</a>
      </nav>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
