import { useEffect, useState } from "react";

export default function BackendHealth() {
  const [state, setState] = useState("checking");

  useEffect(() => {
    fetch("http://localhost:8090/health")
      .then(() => setState("online"))
      .catch(() => setState("offline"));
  }, []);

  return (
    <div className={state === "online" ? "backend online" : "backend offline"}>
      Backend Runtime: {state.toUpperCase()}
    </div>
  );
}
