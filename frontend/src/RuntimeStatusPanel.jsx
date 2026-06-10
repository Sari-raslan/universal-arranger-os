import { useState } from "react";

export default function RuntimeStatusPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function checkRuntime() {
    setError("");
    setData(null);

    try {
      const res = await fetch("http://localhost:8090/runtime/status");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Backend runtime not reachable. Start root npm run dev first.");
    }
  }

  return (
    <div className="card">
      <h3>Backend Runtime Status</h3>
      <button onClick={checkRuntime}>Check Runtime Backend</button>

      {error && <p className="errorText">{error}</p>}
      {data && <pre className="json smallJson">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
