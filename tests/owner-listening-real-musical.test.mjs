import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const catalog = JSON.parse(
  fs.readFileSync("C:/keyboard-manager-clean/docs/owner-listening-pack/real-musical-catalog.json", "utf8")
);

test("real musical catalog meets owner listening correction gates", () => {
  assert.equal(catalog.STATUS, "OWNER_LISTENING_PACK_REAL_MUSICAL_CONTENT_READY");
  assert.ok(catalog.REAL_MUSICAL_WAV_COUNT >= 3);
  assert.ok(catalog.REAL_MUSICAL_UNIQUE_SHA256_COUNT >= 3);
  assert.equal(catalog.TECHNICAL_FIXTURE_USED_AS_MUSICAL_PROOF, "NO");
  assert.equal(catalog.COMMANDER_CHANGED, "NO");
  assert.equal(catalog.V13_OWNED_FILES_CHANGED, "NO");
  assert.equal(catalog.musicalQualityPass, false);
  assert.equal(catalog.TASK_05_00605, "OWNER_GATE");
  for (const example of catalog.examples) {
    assert.equal(example.sineFixture, false);
    assert.equal(example.musicalQualityPass, false);
    assert.equal(fs.existsSync(example.WAV_PATH), true);
    assert.match(example.SHA256, /^[a-f0-9]{64}$/);
    const live = crypto.createHash("sha256").update(fs.readFileSync(example.WAV_PATH)).digest("hex");
    assert.equal(live, example.SHA256, `hash drift ${example.id}`);
    assert.ok(example.DURATION >= 4);
    assert.ok(example.SETTINGS.uniqueMidiCount >= 4);
  }
  const frozen = {
    "01-melody-example": "e338b8293ae47fefa2c17323e40bd417c8b5a99bc271fd67e0c269cd9f07794b",
    "02-arrangement-example": "f521fece833e2d41ec9b540dca5e02c1691701f32e77815c9b721d9a7f2bffcf",
    "03-before-raw-melody": "0318acc4a51f1c72de52256ef30569a375cd322d1a19e8ad26da99a20421fcd3",
    "04-after-arranged": "f521fece833e2d41ec9b540dca5e02c1691701f32e77815c9b721d9a7f2bffcf",
    "06-full-short-demo": "679c11adeef75ce619a2d549681c84be0bee0d8185070e4203c9cddc8ee3d322"
  };
  for (const [id, expected] of Object.entries(frozen)) {
    const example = catalog.examples.find((e) => e.id === id);
    assert.equal(example.SHA256, expected, `approved artifact drifted ${id}`);
  }
  assert.equal(catalog.OWNER_RELISTEN_REQUIRED, "DEFERRED_TO_FINAL_PROGRAM_ACCEPTANCE");
  assert.equal(catalog.EXAMPLE_05_PROVISIONAL_ACCEPTANCE, true);
  assert.equal(catalog.FINAL_MUSICAL_ACCEPTANCE_DEFERRED, true);
  assert.equal(catalog.OWNER_MUSICAL_LISTENING_PASS, false);
  assert.equal(catalog.relisten.old.SHA256, "5be395e999b82835dc0479208d364225737c8fbed5f6832a4b2a6936d188db58");
});
