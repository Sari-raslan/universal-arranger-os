import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config.js";

function manualChunks(id) {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (
    id.includes("/react/") ||
    id.includes("/react-dom/") ||
    id.includes("/scheduler/")
  ) {
    return "react-vendor";
  }

  if (
    id.includes("tone") ||
    id.includes("standardized-audio-context") ||
    id.includes("web-audio")
  ) {
    return "audio-vendor";
  }

  if (
    id.includes("midi") ||
    id.includes("webmidi") ||
    id.includes("jzz")
  ) {
    return "midi-vendor";
  }

  return "vendor";
}

export default defineConfig(async (env) => {
  const resolvedBase =
    typeof baseConfig === "function"
      ? await baseConfig(env)
      : baseConfig || {};

  return mergeConfig(resolvedBase, {
    build: {
      chunkSizeWarningLimit: 500,
      rolldownOptions: {
        output: {
          codeSplitting: true,
          manualChunks
        }
      }
    }
  });
});