# LOCAL-004: Sampler Library Adapter — Contract and Recovery Documentation

**Task ID:** LOCAL-004-SAMPLER-LIBRARY-ADAPTER-RECOVERY  
**Branch:** `copilot/local-004-sampler-library-adapter`  
**Base:** `copilot/main` @ `cacf15463206bf6889e4c623733d5e8d6912e6bb`  
**Status:** IMPLEMENTED_NOT_FULLY_PROVEN (GitHub CI proven; Windows installed/portable not run here)

---

## 1. Recovered State

**Prior state at start:** `NOT_STARTED`

The building blocks existed in committed source:
- `uaos-live-clean/src/library/libraryManifest.js` — manifest model, `normalizeLibraryPath`, path safety
- `uaos-live-clean/src/library/libraryCatalog.js` — catalog model
- `uaos-live-clean/src/sampler/samplerEngine.js` — `SamplerEngine`, `validateSamplerPreset`
- `uaos-live-clean/src/uaos-local-music-engine/library/library.schema.json` — canonical `UAOS_LOCAL_LIBRARY_INDEX` format

**Missing (now added):**
- Transactional Library Builder (staging, commit, rollback, lock, journal)
- Sampler Runtime Library Loader (reads committed product, resolves sample paths)
- LOCAL-004 focused tests
- This documentation

---

## 2. Canonical Adapter Contract

### 2.1 Product Root

`productRoot` is always passed explicitly. Never inferred from `process.cwd()` or any implicit convention.

### 2.2 Directory Layout

```
<productRoot>/
  <libraryId>/
    .build-lock        ← JSON: { lockedAt, pid }; removed after releaseLock()
    .journal.json      ← JSON: build state for interrupted-transaction recovery
    .staging/          ← present only between beginStaging() and commit()/rollback()
      manifest.json
      instruments/
        <preset>.json
      samples/
        ...
    manifest.json      ← committed; visible to SamplerLibraryLoader ONLY after commit()
    instruments/
      <preset>.json
    samples/
      ...
```

### 2.3 Manifest Format

File: `<productRoot>/<libraryId>/manifest.json`

```json
{
  "format": "UAOS_LOCAL_LIBRARY_INDEX",
  "schemaVersion": "1.0.0",
  "version": "<library data version>",
  "libraryId": "<libraryId>",
  "builtAt": "<ISO timestamp>",
  "libraries": [{
    "libraryId": "<libraryId>",
    "name": "<human name>",
    "vendor": "<vendor>",
    "licenseStatus": "original-uaos",
    "status": "indexed",
    "instruments": [{
      "instrumentId": "<id>",
      "name": "<name>",
      "family": "<family>",
      "presetPath": "<relative/path/to/preset.json>",
      "tags": ["..."]
    }]
  }]
}
```

### 2.4 Instrument Preset Format

File: `<productRoot>/<libraryId>/<presetPath>`

```json
{
  "instrumentId": "<id>",
  "schemaVersion": "1.0.0",
  "name": "<name>",
  "family": "<family>",
  "legal": {
    "source": "user-local-or-original-uaos",
    "commercialCopy": false,
    "notes": "..."
  },
  "samples": [{
    "id": "<sampleId>",
    "sampleFile": "<relative/path/to/file.wav>",
    "rootKey": 60,
    "keyLow": 0,
    "keyHigh": 127,
    "velocityLow": 1,
    "velocityHigh": 127
  }]
}
```

### 2.5 Supported Schema Versions

| Version | Status    |
|---------|-----------|
| `1.0.0` | Supported |

Manifests with any other `schemaVersion` are rejected with `UNSUPPORTED_SCHEMA`.

### 2.6 Build Lock

- File: `<libraryDir>/.build-lock`
- Content: `{ "lockedAt": "<ISO>", "pid": <n> }`
- Default stale threshold: **60 seconds**
- A non-stale lock throws `BuildLockError`
- A stale or unreadable lock is removed and a new one is acquired

### 2.7 Recovery Journal

- File: `<libraryDir>/.journal.json`
- States: `STAGING` → `COMMITTED` | `FAILED` | `RECOVERED_ROLLBACK`
- `recoverFromJournal()` rolls back any incomplete staging dir found alongside a `STAGING` journal entry

### 2.8 Path Safety Rules

All `presetPath` and `sampleFile` values stored in manifests and presets:
- Must be **relative** (no leading `/`, no Windows drive letters `C:\`)
- Must not contain `..` segments
- Windows backslashes are normalised to forward-slash before storage and resolution
- Unicode paths are supported (Node.js `path` handles them natively)

Violation of any rule throws `PathSafetyError` during `beginStaging()`, and returns `LOAD_ERROR.PATH_TRAVERSAL` during loading.

---

## 3. Files Changed

| File | Action | Description |
|------|--------|-------------|
| `uaos-live-clean/src/library/transactionalLibraryBuilder.js` | **NEW** | Transactional builder: staging, commit, rollback, lock, journal |
| `uaos-live-clean/src/sampler/samplerLibraryLoader.js` | **NEW** | Runtime loader: reads committed manifest, resolves sample paths |
| `tests/local-004-sampler-library-adapter.test.mjs` | **NEW** | 22 focused tests covering all adapter contract requirements |
| `docs/local-004-adapter-contract.md` | **NEW** | This document |

No existing files were modified.

---

## 4. Focused Test Matrix

| # | Test | Scenario |
|---|------|----------|
| 1 | Successful build → commit → load | Happy path end-to-end |
| 2 | Isolated temporary productRoot | Temp dir isolation |
| 3 | productRoot with spaces | Path with spaces |
| 4 | STAGING_LOAD_REJECTED before commit | Commit visibility boundary |
| 5 | MANIFEST_NOT_FOUND for non-existent lib | Staging invisibility |
| 6 | MANIFEST_NOT_FOUND — no manifest.json | Missing manifest |
| 7 | MANIFEST_MALFORMED — invalid JSON | Malformed manifest |
| 8 | UNSUPPORTED_SCHEMA | Unsupported schema version |
| 9 | SAMPLE_NOT_FOUND | Missing sample file |
| 10 | PATH_TRAVERSAL — presetPath with `..` | Path traversal (preset) |
| 11 | PATH_TRAVERSAL — sampleFile with `..` | Path traversal (sample) |
| 12 | Rollback preserves committed product | Rollback safety |
| 13 | Active lock rejection | Build lock conflict |
| 14 | Stale lock removed and rebuilt | Stale lock recovery |
| 15 | Interrupted journal recovery | Journal-based recovery |
| 16 | Journal COMMITTED state after commit | Journal cleanup |
| 17 | Windows backslash normalisation | `\` → `/` normalisation |
| 18 | Unicode library ID | Unicode path handling |
| 19 | Fixture marked non-commercial | `legal.commercialCopy === false` |
| 20 | Staging dir removed after commit | Temp-dir cleanup |
| 21 | Absolute sampleFile rejected | Absolute path safety |
| 22 | nothing-to-recover when no journal | Recovery no-op |

---

## 5. Test Commands and Results

```
node --test tests/local-004-sampler-library-adapter.test.mjs
```

**Result:** 22/22 PASS

```
node --test tests/library-engine.test.mjs tests/sampler-engine.test.mjs \
  tests/phase12-daw-sampler-foundation.test.mjs tests/phase4-audio-sampler.test.mjs \
  tests/midi-sampler-integration.test.mjs
```

**Result:** 30/30 PASS (pre-existing `library-sampler-ui.test.mjs` App-source check fails independently; confirmed pre-existing before this branch)

---

## 6. Security and Path Safety Notes

- `normalizePath()` in `transactionalLibraryBuilder.js` rejects absolute paths (POSIX and Windows), `.` relative prefix, and `..` traversal before any file write or read.
- `SamplerLibraryLoader._resolveSample()` additionally uses `path.relative(libraryDir, resolvedPath)` as a second defence against traversal after resolution.
- The loader never reads from `.staging/`; it only reads `manifest.json` at the library root.
- `STAGING_LOAD_REJECTED` is returned when staging exists but no committed manifest does, preventing accidental loads of uncommitted content.
- Fixture WAV files in tests are clearly named `*.test-fixture.wav` and contain 4 bytes of non-audio data.
- No network access. No external downloads. No commercial or third-party audio content.

---

## 7. Known Limitations

1. **Windows installed/portable behaviour**: The adapter is implemented in portable Node.js (`node:fs`, `node:path`). Windows drive-letter detection and path normalisation are included. However, a full installed/portable run on a Windows machine was not performed in this GitHub task environment.

2. **Atomic commit on Windows**: `fs.copyFileSync` + `fs.rmSync` is used instead of `fs.renameSync` to avoid cross-device rename failures. This is not byte-for-byte atomic but is safe for the use case (testing environments and development).

3. **Large sample libraries**: The loader checks file existence only; it does not stream or validate audio content. Large library loads are bounded only by file-system speed.

4. **SamplerEngine integration**: The loader returns resolved paths and instrument descriptors. Wiring the resolved paths into `SamplerEngine.loadPreset()` / `SampleCache.loadArrayBuffer()` (via `fs.readFileSync` in Node.js or `fetch` in the browser) is the caller's responsibility and is covered by the existing `SamplerEngine` tests.

---

## 8. Remaining Local Validation Requirements

The following must be validated by the local Visual Studio Code Orchestrator:

- [ ] Full `npm test` run on Windows (paths with backslashes, drive letters)
- [ ] `SamplerEngine.loadPreset()` wired to a loaded instrument from `SamplerLibraryLoader`
- [ ] End-to-end playback preview (audio decode + voice allocation) in the Electron desktop build
- [ ] Integration with `LOCAL-005-OWNER-PREVIEW-PLAYER-RECOVERY` and `LOCAL-006-OWNER-PACK-SELECTION-RECOVERY`

---

## 9. Singy Confirmation

UAOS Singy (`singer/`, `singy/`, social media pipeline) source, tests, and documentation were **not read, not modified, and not touched** in this task.
