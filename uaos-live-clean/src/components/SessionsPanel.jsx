import { useEffect, useState } from "react";
import {
  deleteProject,
  fetchBackendHealth,
  fetchProject,
  listProjects,
  saveProject
} from "../lib/uaosApiClient.js";
import {
  clearSession,
  exportSession,
  importSession,
  loadSession,
  saveSession
} from "../session/sessionStore.js";

function normalizeProjects(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.projects)) {
    return payload.projects;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function normalizeProject(payload) {
  return payload?.project || payload?.item || payload;
}

function createProjectPayload(session) {
  const now = new Date().toISOString();

  return {
    id: String(session?.id || `uaos-${Date.now()}`),
    name: String(session?.name || "Untitled UAOS Project"),
    description: "UAOS local project session",
    createdAt: session?.createdAt || now,
    updatedAt: now,
    timeline: Array.isArray(session?.timeline)
      ? session.timeline
      : [],
    session,
    metadata: {
      source: "uaos-live-clean",
      version: session?.version || 1,
      savedAt: now
    }
  };
}

export function SessionsPanel({ session, onSessionChange }) {
  const [message, setMessage] = useState("");
  const [backendState, setBackendState] = useState("checking");
  const [projects, setProjects] = useState([]);
  const [busy, setBusy] = useState(false);

  async function refreshProjects() {
    setBusy(true);

    try {
      await fetchBackendHealth();
      setBackendState("online");

      const payload = await listProjects();
      setProjects(normalizeProjects(payload));
      setMessage("Backend connected.");
    } catch (error) {
      setBackendState("offline");
      setMessage(
        `Backend unavailable. Local save still works. ${error.message}`
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshProjects();
  }, []);

  function saveLocal() {
    const saved = saveSession(session);
    onSessionChange(saved);
    setMessage("Saved locally.");
  }

  function loadLocal() {
    const loaded = loadSession();
    onSessionChange(loaded);
    setMessage("Loaded local session.");
  }

  async function saveToBackend() {
    setBusy(true);

    try {
      const savedLocal = saveSession(session);
      onSessionChange(savedLocal);

      const payload = createProjectPayload(savedLocal);
      const result = normalizeProject(await saveProject(payload));

      setBackendState("online");
      setMessage(
        `Saved to backend: ${result?.name || payload.name}`
      );

      const listPayload = await listProjects();
      setProjects(normalizeProjects(listPayload));
    } catch (error) {
      setBackendState("offline");
      setMessage(`Backend save failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadFromBackend(id) {
    setBusy(true);

    try {
      const result = normalizeProject(await fetchProject(id));

      if (!result?.session) {
        throw new Error("The selected project has no saved session.");
      }

      onSessionChange(result.session);
      saveSession(result.session);
      setBackendState("online");
      setMessage(`Loaded from backend: ${result.name}`);
    } catch (error) {
      setMessage(`Backend load failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeFromBackend(id) {
    const confirmed = window.confirm(
      "Delete this backend project permanently?"
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);

    try {
      await deleteProject(id, true);
      setMessage("Backend project deleted.");

      const payload = await listProjects();
      setProjects(normalizeProjects(payload));
    } catch (error) {
      setMessage(`Delete failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  function clearLocal() {
    clearSession();
    setMessage("Local session cleared.");
  }

  function download() {
    const blob = new Blob(
      [exportSession(session)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${session?.name || "uaos-session"}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
    setMessage("Session exported.");
  }

  async function upload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const imported = importSession(await file.text());
      onSessionChange(imported);
      saveSession(imported);
      setMessage("Session imported and saved locally.");
    } catch (error) {
      setMessage(`Import failed: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="panelSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Sessions</p>
          <h2>Local and backend project storage</h2>
        </div>

        <span>
          Backend: {backendState}
        </span>
      </div>

      <label className="uaosField">
        <span>Project name</span>

        <input
          value={session.name}
          onChange={(event) =>
            onSessionChange({
              ...session,
              name: event.target.value
            })
          }
        />
      </label>

      <div className="controlRow">
        <button
          type="button"
          disabled={busy}
          onClick={saveLocal}
        >
          Save Local
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={loadLocal}
        >
          Load Local
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={saveToBackend}
        >
          Save Backend
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={refreshProjects}
        >
          Refresh Backend
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={download}
        >
          Export JSON
        </button>

        <label className="buttonLike">
          Import JSON

          <input
            type="file"
            accept="application/json"
            onChange={upload}
            hidden
          />
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={clearLocal}
        >
          Clear Local
        </button>
      </div>

      <div className="sessionProjectList">
        {projects.length === 0 ? (
          <p>No backend projects found.</p>
        ) : (
          projects.map((project) => (
            <article
              key={project.id}
              className="sessionProjectCard"
            >
              <div>
                <strong>
                  {project.name || "Untitled Project"}
                </strong>

                <small>
                  {project.updatedAt
                    ? new Date(project.updatedAt).toLocaleString()
                    : "Unknown save time"}
                </small>
              </div>

              <div className="controlRow">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    loadFromBackend(project.id)
                  }
                >
                  Load
                </button>

                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    removeFromBackend(project.id)
                  }
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {message && (
        <p role="status">
          {message}
        </p>
      )}
    </section>
  );
}
