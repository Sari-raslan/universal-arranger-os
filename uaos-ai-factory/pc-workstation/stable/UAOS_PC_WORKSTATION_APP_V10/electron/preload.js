const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("uaosApp", {
  label: "UAOS PC Workstation",
  safety: [
    "PC_ONLY",
    "UAOS_FORMAT",
    "TEST_UNVERIFIED",
    "NOT_FOR_PA3X_LOAD",
    "NOT_FOR_USB_TRANSFER",
    "NOT_COMPATIBILITY_VERIFIED"
  ]
});
