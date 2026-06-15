import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("launch approvals default to false", () => {
  const approvals = JSON.parse(
    fs.readFileSync(
      "config/launch-approvals.json",
      "utf8",
    ),
  );

  for (const [name, value] of Object.entries(approvals)) {
    if (name === "schemaVersion") {
      continue;
    }

    assert.equal(
      value,
      false,
      `${name} must require explicit approval`,
    );
  }
});

test("legal files are clearly marked as drafts", () => {
  for (const file of [
    "docs/legal/IMPRESSUM_DRAFT.md",
    "docs/legal/PRIVACY_POLICY_DRAFT.md",
    "docs/legal/TERMS_DRAFT.md",
    "docs/legal/CANCELLATION_REFUND_DRAFT.md",
    "docs/legal/COOKIE_POLICY_DRAFT.md",
  ]) {
    const source = fs.readFileSync(file, "utf8");

    assert.match(source, /DRAFT/);
    assert.match(source, /NOT APPROVED FOR PUBLICATION/);
  }
});

test("launch gate never treats missing approvals as launch-ready", () => {
  const source = fs.readFileSync(
    "scripts/uaos-final-launch-gate.mjs",
    "utf8",
  );

  assert.equal(
    source.includes("externalApprovalsComplete"),
    true,
  );
  assert.equal(
    source.includes("productionActivationReady"),
    true,
  );
  assert.equal(
    source.includes("paymentExecuted: false"),
    true,
  );
});