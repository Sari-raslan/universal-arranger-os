import { useEffect, useRef, useState } from "react";
import { createNeutralArrangementPreview } from "../audio/neutralArrangementPreview.js";

export function NeutralMidiPreview({
  bpm,
  keyName,
  scale,
  sectionsJson
}) {
  const previewRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function stopPreview() {
    previewRef.current?.stop();
    previewRef.current = null;
    setStatus("idle");
    setMessage("Preview stopped.");
  }

  function startPreview() {
    stopPreview();
    setMessage("");

    try {
      const sections = JSON.parse(sectionsJson);
      const preview = createNeutralArrangementPreview({
        bpm: Number(bpm),
        key: keyName,
        scale,
        sections
      });

      previewRef.current = preview;
      setStatus("playing");
      setMessage(
        `Preview playing for about ${Math.ceil(preview.durationSeconds)} seconds.`
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start preview."
      );
    }
  }

  useEffect(() => {
    return () => {
      previewRef.current?.stop();
    };
  }, []);

  return (
    <div className="controlRow" aria-label="Neutral MIDI preview">
      <button
        type="button"
        className="secondary"
        onClick={startPreview}
        disabled={status === "playing"}
      >
        Preview Arrangement
      </button>

      <button
        type="button"
        className="secondary"
        onClick={stopPreview}
        disabled={status !== "playing"}
      >
        Stop Preview
      </button>

      {message ? (
        <span role={status === "error" ? "alert" : "status"}>
          {message}
        </span>
      ) : null}
    </div>
  );
}