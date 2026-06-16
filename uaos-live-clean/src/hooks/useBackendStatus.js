import { useEffect, useState } from "react";
import { fetchBackendStatus } from "../lib/uaosApiClient.js";

const INITIAL_STATE = {
  state: "loading",
  error: "",
  status: null,
};

export function useBackendStatus(refreshMs = 15000) {
  const [backend, setBackend] = useState(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const status = await fetchBackendStatus();
        if (cancelled) return;
        setBackend({
          state: "online",
          error: "",
          status,
        });
      } catch (error) {
        if (cancelled) return;
        setBackend({
          state: "offline",
          error: error instanceof Error ? error.message : String(error),
          status: null,
        });
      }
    }

    load();
    const timer = window.setInterval(load, refreshMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [refreshMs]);

  return backend;
}
