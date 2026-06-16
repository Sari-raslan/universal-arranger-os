const DEFAULT_LOCAL_API_BASE_URL = "http://127.0.0.1:5199";
const API_BASE_URL = String(
  import.meta.env.VITE_UAOS_API_URL ||
  import.meta.env.VITE_UAOS_BACKEND_URL ||
  DEFAULT_LOCAL_API_BASE_URL,
).replace(/\/+$/, "");

function buildUrl(pathname) {
  return `${API_BASE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function requestJson(pathname, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    signal,
  } = options;

  const response = await fetch(buildUrl(pathname), {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await parseResponse(response).catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      (typeof payload === "string" && payload) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

async function requestBinary(pathname, options = {}) {
  const response = await fetch(buildUrl(pathname), options);
  if (!response.ok) {
    const payload = await parseResponse(response).catch(() => null);
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return response;
}

export function getLocalApiBaseUrl() {
  return API_BASE_URL;
}

export async function fetchBackendStatus() {
  return requestJson("/api/status");
}

export async function fetchBackendHealth() {
  return requestJson("/api/health");
}

export async function listLibraryItems() {
  return requestJson("/api/library");
}

export async function fetchLibraryItem(id) {
  return requestJson(`/api/library/${encodeURIComponent(id)}`);
}

export async function exportLibraryItem(id) {
  return requestBinary(`/api/export/${encodeURIComponent(id)}`);
}

export async function uploadLibraryItem(input) {
  return requestJson("/api/upload", {
    method: "POST",
    body: input,
  });
}

export async function deleteLibraryItem(id) {
  return requestJson(`/api/library/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function listProjects() {
  return requestJson("/api/project/list");
}

export async function saveProject(project) {
  return requestJson("/api/project/save", {
    method: "POST",
    body: project,
  });
}

export async function fetchProject(id) {
  return requestJson(`/api/project/${encodeURIComponent(id)}`);
}

export async function updateProject(id, changes) {
  return requestJson(`/api/project/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: changes,
  });
}

export async function renameProject(id, name) {
  return requestJson(`/api/project/${encodeURIComponent(id)}/rename`, {
    method: "POST",
    body: { name },
  });
}

export async function duplicateProject(id) {
  return requestJson(`/api/project/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
  });
}

export async function deleteProject(id, confirmed = false) {
  return requestJson(`/api/project/${encodeURIComponent(id)}${confirmed ? "?confirmed=true" : ""}`, {
    method: "DELETE",
  });
}

export async function fetchSamplerMap() {
  return requestJson("/api/sampler/map");
}

export async function saveSamplerMap(map) {
  return requestJson("/api/sampler/map", {
    method: "POST",
    body: Array.isArray(map) ? map : [],
  });
}

export async function importSample(base64, filename) {
  return requestJson("/api/samples/import", {
    method: "POST",
    body: { base64, filename },
  });
}

export async function exportMidi(pattern) {
  const response = await requestBinary("/api/midi-export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pattern || {}),
  });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${pattern?.name || "uaos-pattern"}.mid`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function getJson(pathname, body = null) {
  return requestJson(pathname, body ? { method: "POST", body } : {});
}

export async function api(pathname, options = {}) {
  return requestBinary(pathname, options);
}
