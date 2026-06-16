import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { detectMidiDeviceProfile } from "../midi/deviceProfiles.js";
import { parseMidiMessage } from "../midi/midiMessageParser.js";
import { getMidiNavigator, isWebMidiAvailable } from "./midiEnvironment.js";

function listInputs(access) {
  return Array.from(access?.inputs?.values?.() || []).map((input) => ({
    id: input.id,
    name: input.name || "Unnamed MIDI input",
    manufacturer: input.manufacturer || "",
    state: input.state || "unknown",
    connection: input.connection || "unknown",
  }));
}

export function useWebMidiInput({ onMidiEvent }) {
  const accessRef = useRef(null);
  const inputRef = useRef(null);
  const callbackRef = useRef(onMidiEvent);

  const [support, setSupport] = useState(isWebMidiAvailable() ? "available" : "unavailable");
  const [connection, setConnection] = useState("disconnected");
  const [error, setError] = useState("");
  const [inputs, setInputs] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState("");
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    callbackRef.current = onMidiEvent;
  }, [onMidiEvent]);

  const detachInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.onmidimessage = null;
      inputRef.current = null;
    }
  }, []);

  const refreshInputs = useCallback((access) => {
    const nextInputs = listInputs(access);
    setInputs(nextInputs);

    setSelectedInputId((current) => {
      if (current && nextInputs.some((input) => input.id === current)) {
        return current;
      }

      return nextInputs[0]?.id || "";
    });
  }, []);

  const attachInput = useCallback(
    (inputId) => {
      detachInput();

      const access = accessRef.current;
      if (!access || !inputId) {
        setConnection(access ? "waiting-for-device" : "disconnected");
        return;
      }

      const input = access.inputs.get(inputId);
      if (!input) {
        setConnection("waiting-for-device");
        return;
      }

      input.onmidimessage = (event) => {
        try {
          const message = parseMidiMessage(event.data, event.timeStamp);
          const enriched = {
            ...message,
            inputId: input.id,
            inputName: input.name || "Unnamed MIDI input",
            manufacturer: input.manufacturer || "",
          };

          setLastMessage(enriched);
          callbackRef.current?.(enriched);
        } catch (messageError) {
          setError(messageError.message);
        }
      };

      inputRef.current = input;
      setConnection("connected");
      setError("");
    },
    [detachInput],
  );

  useEffect(() => {
    if (accessRef.current) {
      attachInput(selectedInputId);
    }

    return detachInput;
  }, [attachInput, detachInput, selectedInputId]);

  const connect = useCallback(async () => {
    const midiNavigator = getMidiNavigator();
    if (!midiNavigator) {
      setSupport("unavailable");
      setError("Web MIDI is not available in this browser or runtime.");
      return false;
    }

    try {
      setConnection("requesting-permission");
      const access = await midiNavigator.requestMIDIAccess({ sysex: false });
      accessRef.current = access;
      setSupport("available");

      access.onstatechange = () => {
        refreshInputs(access);
      };

      refreshInputs(access);
      setConnection(access.inputs.size > 0 ? "connected" : "waiting-for-device");
      setError("");
      return true;
    } catch (accessError) {
      setConnection("permission-denied");
      setError(accessError.message || "MIDI permission was not granted.");
      return false;
    }
  }, [refreshInputs]);

  const disconnect = useCallback(() => {
    detachInput();

    if (accessRef.current) {
      accessRef.current.onstatechange = null;
    }

    accessRef.current = null;
    setConnection("disconnected");
    setInputs([]);
    setSelectedInputId("");
    setLastMessage(null);
  }, [detachInput]);

  const selectedInput = useMemo(
    () => inputs.find((input) => input.id === selectedInputId) || null,
    [inputs, selectedInputId],
  );

  const deviceProfile = useMemo(
    () =>
      detectMidiDeviceProfile(
        selectedInput?.name || "",
        selectedInput?.manufacturer || "",
      ),
    [selectedInput],
  );

  return {
    support,
    connection,
    error,
    inputs,
    selectedInputId,
    setSelectedInputId,
    selectedInput,
    deviceProfile,
    lastMessage,
    connect,
    disconnect,
  };
}
