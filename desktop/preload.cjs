const { contextBridge, ipcRenderer } = require("electron");

const allowed = new Set(["uaos-midi-list-inputs", "uaos-midi-list-outputs", "uaos-midi-test"]);

function invoke(channel) {
  if (!allowed.has(channel)) return Promise.reject(new Error("IPC channel is not allowed."));
  return ipcRenderer.invoke(channel);
}

contextBridge.exposeInMainWorld("uaosMidi", {
  listInputs: () => invoke("uaos-midi-list-inputs"),
  listOutputs: () => invoke("uaos-midi-list-outputs"),
  test: () => invoke("uaos-midi-test")
});
