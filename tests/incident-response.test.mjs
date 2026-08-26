import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateIncidentResponse } from "../backend/src/qa/incidentResponse.js";

const SCHEMA_PATH =
  "C:/UAOS_AGENT_FACTORY_WORKTREES/singy-integration/tools/reaper-bridge/schemas/response.schema.json";

test("incident response schema validates success and fail-closed errors", () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const ok = validateIncidentResponse(
    {
      requestId: "req-1",
      ok: true,
      result: { status: "recorded" },
      errorCode: null,
      errorMessage: null,
      completedAtUtc: "2026-08-25T00:00:00.000Z"
    },
    schema
  );
  assert.equal(ok.ok, true);
  const fail = validateIncidentResponse(
    {
      requestId: "req-2",
      ok: false,
      result: {},
      errorCode: "TIMEOUT",
      errorMessage: "bridge timed out",
      completedAtUtc: "2026-08-25T00:00:01.000Z"
    },
    schema
  );
  assert.equal(fail.ok, true);
});

test("extra fields and missing errorCode fail closed", () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  assert.equal(
    validateIncidentResponse(
      {
        requestId: "x",
        ok: true,
        result: {},
        completedAtUtc: "2026-08-25T00:00:00.000Z",
        extra: 1
      },
      schema
    ).ok,
    false
  );
  assert.equal(
    validateIncidentResponse(
      {
        requestId: "x",
        ok: false,
        result: {},
        completedAtUtc: "2026-08-25T00:00:00.000Z"
      },
      schema
    ).ok,
    false
  );
});
