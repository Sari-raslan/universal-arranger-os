const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs");

let easymidi = null;
try {
  easymidi = require("easymidi");
} catch {
  easymidi = null;
}

const activeMidiInputs = new Map();

const desktopLoadPolicy = Object.freeze({
  devUrl: process.env.UAOS_DESKTOP_URL || "http://127.0.0.1:5173",
  distPath: path.join(__dirname, "..", "uaos-live-clean", "dist", "index.html")
});

function listInputs() {
  if (!easymidi) {
    return {
      ok: false,
      error: "easymidi not available.",
      inputs: []
    };
  }

  return {
    ok: true,
    inputs: easymidi.getInputs().map((name, index) => ({
      id: name,
      name,
      state: "connected",
      index
    }))
  };
}

function listOutputs() {
  if (!easymidi) {
    return {
      ok: false,
      error: "easymidi not available.",
      outputs: []
    };
  }

  return {
    ok: true,
    outputs: easymidi.getOutputs().map((name, index) => ({
      id: name,
      name,
      state: "connected",
      index
    }))
  };
}

function toRawMidi(type, message = {}) {
  const channel = Math.max(0, Math.min(15, Number(message.channel || 0)));

  if (type === "noteon") {
    return [0x90 | channel, Number(message.note || 0), Number(message.velocity || 0)];
  }

  if (type === "noteoff") {
    return [0x80 | channel, Number(message.note || 0), Number(message.velocity || 0)];
  }

  if (type === "cc") {
    return [0xb0 | channel, Number(message.controller || 0), Number(message.value || 0)];
  }

  if (type === "program") {
    return [0xc0 | channel, Number(message.number || 0)];
  }

  if (type === "pitch") {
    const value = Math.max(
      0,
      Math.min(16383, Number(message.value || 0) + 8192)
    );

    return [
      0xe0 | channel,
      value & 0x7f,
      (value >> 7) & 0x7f
    ];
  }

  if (type === "poly aftertouch") {
    return [
      0xa0 | channel,
      Number(message.note || 0),
      Number(message.pressure || 0)
    ];
  }

  if (type === "channel aftertouch") {
    return [
      0xd0 | channel,
      Number(message.pressure || 0)
    ];
  }

  return null;
}

function stopMidiInput(senderId) {
  const active = activeMidiInputs.get(senderId);

  if (!active) {
    return { ok: true, stopped: false };
  }

  try {
    active.input.close();
  } catch {
    // Renderer may already be closed.
  }

  activeMidiInputs.delete(senderId);

  return { ok: true, stopped: true };
}

function startMidiInput(sender, inputName) {
  if (!easymidi) {
    return {
      ok: false,
      error: "easymidi is not installed."
    };
  }

  if (!inputName || !easymidi.getInputs().includes(inputName)) {
    return {
      ok: false,
      error: "Selected MIDI input is unavailable."
    };
  }

  stopMidiInput(sender.id);

  try {
    const input = new easymidi.Input(inputName);
    const eventTypes = [
      "noteon",
      "noteoff",
      "cc",
      "program",
      "pitch",
      "poly aftertouch",
      "channel aftertouch"
    ];

    for (const type of eventTypes) {
      input.on(type, (message) => {
        const raw = toRawMidi(type, message);

        if (!raw || sender.isDestroyed()) {
          return;
        }

        sender.send("uaos-midi-message", {
          inputId: inputName,
          raw,
          receivedAt: Date.now()
        });
      });
    }

    activeMidiInputs.set(sender.id, {
      input,
      inputName
    });

    return {
      ok: true,
      inputId: inputName
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Could not open MIDI input."
    };
  }
}

ipcMain.handle(
  "uaos-midi-list-inputs",
  async () => listInputs()
);

ipcMain.handle(
  "uaos-midi-list-outputs",
  async () => listOutputs()
);

ipcMain.handle(
  "uaos-midi-test",
  async () => ({
    ok: true,
    easymidi: Boolean(easymidi),
    message: easymidi
      ? "UAOS Electron MIDI bridge ready"
      : "Electron bridge ready; easymidi unavailable"
  })
);

ipcMain.handle(
  "uaos-midi-start-input",
  async (event, inputName) =>
    startMidiInput(event.sender, inputName)
);

ipcMain.handle(
  "uaos-midi-stop-input",
  async (event) =>
    stopMidiInput(event.sender.id)
);

function configurePermissions() {
  const allowedPermissions = new Set([
    "media",
    "midi",
    "midiSysex"
  ]);

  const ses = session.defaultSession;

  ses.setPermissionCheckHandler(
    (_webContents, permission) =>
      allowedPermissions.has(permission)
  );

  ses.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(allowedPermissions.has(permission));
    }
  );
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0a0d12",
    title: "UAOS V1",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const senderId = win.webContents.id;

  win.webContents.on(
    "render-process-gone",
    () => stopMidiInput(senderId)
  );

  win.on(
    "closed",
    () => stopMidiInput(senderId)
  );

  if (fs.existsSync(desktopLoadPolicy.distPath)) {
    win.loadFile(desktopLoadPolicy.distPath);
  } else {
    win.loadURL(desktopLoadPolicy.devUrl);
  }
}

app.whenReady().then(() => {
  configurePermissions();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  for (const senderId of activeMidiInputs.keys()) {
    stopMidiInput(senderId);
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

module.exports = {
  desktopLoadPolicy,
  listInputs,
  listOutputs,
  startMidiInput,
  stopMidiInput,
  toRawMidi
};
