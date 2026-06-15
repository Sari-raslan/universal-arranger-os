import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  "uaos-live-clean/src/components/AccountShell.jsx",
  "utf8",
);

test("AccountShell keeps React arrow functions valid", () => {
  assert.equal(
    /onClick=\{\(\)\s*=(?!>)/.test(source),
    false,
  );
  assert.equal(
    /^\s*onClick=\{\(\)\s*=>\s*\{\}\}\s*$/m.test(
      source,
    ),
    false,
  );
  assert.match(source, /useEffect\(\(\)\s*=>\s*\{/);
});

test("Founders checkout buttons are disabled without handlers", () => {
  for (const label of [
    "Studio founders price - checkout under review",
    "Pro founders price - checkout under review",
  ]) {
    const labelIndex = source.indexOf(label);

    assert.ok(labelIndex >= 0, label);

    const start = source.lastIndexOf("<button", labelIndex);
    const end = source.indexOf(">", start);
    const tag = source.slice(start, end + 1);

    assert.match(tag, /\bdisabled\b/);
    assert.equal(tag.includes("onClick="), false);
  }
});
