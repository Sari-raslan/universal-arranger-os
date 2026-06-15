const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("uaosMidi", {
  listDevices: () => ipcRenderer.invoke("uaos:midi:list-devices"),
  reconnect: () => ipcRenderer.invoke("uaos:midi:reconnect"),
  send: (message) => ipcRenderer.invoke("uaos:midi:send", message),
  capabilities: () => ipcRenderer.invoke("uaos:midi:capabilities"),
});
