const { contextBridge, ipcRenderer } = require("electron");

const allowedInvoke = new Set([
  "uaos-midi-list-inputs",
  "uaos-midi-list-outputs",
  "uaos-midi-test",
  "uaos-midi-start-input",
  "uaos-midi-stop-input"
]);

function invoke(channel, ...args) {
  if (!allowedInvoke.has(channel)) {
    return Promise.reject(
      new Error("IPC channel is not allowed.")
    );
  }

  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("uaosMidi", {
  listInputs: () =>
    invoke("uaos-midi-list-inputs"),

  listOutputs: () =>
    invoke("uaos-midi-list-outputs"),

  test: () =>
    invoke("uaos-midi-test"),

  startInput: (inputId) =>
    invoke("uaos-midi-start-input", inputId),

  stopInput: () =>
    invoke("uaos-midi-stop-input"),

  onMessage: (callback) => {
    const listener = (_event, payload) => callback(payload);

    ipcRenderer.on(
      "uaos-midi-message",
      listener
    );

    return () => {
      ipcRenderer.removeListener(
        "uaos-midi-message",
        listener
      );
    };
  }
});
