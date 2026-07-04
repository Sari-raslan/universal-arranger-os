const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("uaosDesktop", {
  label: "UAOS PC Workstation Owner Beta",
  mode: "LOCAL_DESKTOP_ONLY",
  safety: [
    "PC_ONLY",
    "UAOS_FORMAT",
    "TEST_UNVERIFIED",
    "NOT_FOR_PA3X_LOAD",
    "NOT_FOR_USB_TRANSFER",
    "NOT_COMPATIBILITY_VERIFIED"
  ]
});
