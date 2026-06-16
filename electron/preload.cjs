const {
  contextBridge,
  ipcRenderer,
} = require("electron");

const allowedInvoke = new Set([
  "uaos-midi-test",
  "uaos-midi-list-inputs",
  "uaos-midi-list-outputs",
  "uaos-midi-start-input",
  "uaos-midi-stop-input",
  "uaos:midi:list-devices",
  "uaos:midi:reconnect",
  "uaos:midi:send",
  "uaos:midi:capabilities",
]);

function invoke(channel, ...args) {
  if (!allowedInvoke.has(channel)) {
    return Promise.reject(
      new Error("IPC channel is not allowed."),
    );
  }

  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld(
  "uaosMidi",
  {
    test: () =>
      invoke("uaos-midi-test"),

    listInputs: () =>
      invoke("uaos-midi-list-inputs"),

    listOutputs: () =>
      invoke("uaos-midi-list-outputs"),

    startInput: (inputId) =>
      invoke(
        "uaos-midi-start-input",
        inputId,
      ),

    stopInput: () =>
      invoke("uaos-midi-stop-input"),

    onMessage: (callback) => {
      const listener = (
        _event,
        payload,
      ) => callback(payload);

      ipcRenderer.on(
        "uaos-midi-message",
        listener,
      );

      return () => {
        ipcRenderer.removeListener(
          "uaos-midi-message",
          listener,
        );
      };
    },

    listDevices: () =>
      invoke("uaos:midi:list-devices"),

    reconnect: () =>
      invoke("uaos:midi:reconnect"),

    send: (message) =>
      invoke("uaos:midi:send", message),

    capabilities: () =>
      invoke("uaos:midi:capabilities"),
  },
);
