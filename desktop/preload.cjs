const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('uaosMidi', {
  listInputs: () => ipcRenderer.invoke('uaos-midi-list-inputs'),
  listOutputs: () => ipcRenderer.invoke('uaos-midi-list-outputs'),
  test: () => ipcRenderer.invoke('uaos-midi-test')
});
