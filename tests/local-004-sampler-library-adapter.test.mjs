/**
 * LOCAL-004: Sampler Library Adapter — Focused Tests
 *
 * Proves that a transactionally built library becomes visible to the Sampler Runtime
 * only after a successful commit(), and that all error and safety conditions are handled
 * with truthful structured responses.
 *
 * All fixtures are synthesised in temporary directories created at test time and cleaned
 * up after each test group. No network access, no external downloads, no commercial content.
 *
 * Fixture notice: every sample file written here is a minimal 4-byte placeholder
 * (not valid audio). Files are labelled ".test-fixture.wav" to make their non-commercial,
 * non-production purpose unambiguous.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  BuildLockError,
  MANIFEST_FILE_NAME,
  PRODUCT_SCHEMA_VERSION,
  TransactionalLibraryBuilder,
  normalizePath,
} from '../uaos-live-clean/src/library/transactionalLibraryBuilder.js';

import {
  LOAD_ERROR,
  SamplerLibraryLoader,
} from '../uaos-live-clean/src/sampler/samplerLibraryLoader.js';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

/** Create a fresh isolated temp directory for one test. */
function tempRoot(label = 'uaos-004') {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${label}-`));
}

/** Remove a directory tree unconditionally. */
function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup in tests
  }
}

/**
 * Write a minimal 4-byte placeholder WAV file clearly labelled as a test fixture.
 * This file is NOT valid audio; it exists only to satisfy file-existence checks.
 */
function writeFixtureWav(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  // 4 bytes: sentinel that is clearly not a real audio sample
  fs.writeFileSync(filePath, Buffer.from([0x54, 0x45, 0x53, 0x54])); // "TEST"
}

/** Minimal instrument spec for use in tests. */
function fixtureInstrument(overrides = {}) {
  return {
    instrumentId: 'inst-oud-001',
    name: 'Oud Fixture',
    family: 'strings-oriental',
    presetPath: 'instruments/oud.json',
    tags: ['oriental', 'plucked', 'test-fixture'],
    legal: {
      source: 'user-local-or-original-uaos',
      notes: 'UAOS LOCAL-004 test fixture — not commercial content',
    },
    samples: [
      {
        id: 'oud-c4',
        sampleFile: 'samples/oud-c4.test-fixture.wav',
        rootKey: 60,
        keyLow: 48,
        keyHigh: 72,
        velocityLow: 1,
        velocityHigh: 127,
      },
    ],
    ...overrides,
  };
}

/**
 * Build a complete library fixture:
 *  1. acquireLock
 *  2. beginStaging with sample files placed in staging
 *  3. copy sample files into staging (simulating real sample placement)
 *  4. commit
 *  5. releaseLock
 *
 * Returns the productRoot used.
 */
function buildAndCommitFixture(productRoot, libraryId = 'test-lib') {
  const builder = new TransactionalLibraryBuilder({ productRoot, libraryId });
  builder.acquireLock();

  const instruments = [fixtureInstrument()];
  builder.beginStaging({ name: 'Test Library Fixture', instruments });

  // Place sample file into staging so path resolution succeeds after commit
  const stagingDir = path.join(productRoot, libraryId, '.staging');
  writeFixtureWav(path.join(stagingDir, 'samples', 'oud-c4.test-fixture.wav'));

  builder.commit();
  builder.releaseLock();
  return productRoot;
}

// ─── 1. Successful build → commit → load ─────────────────────────────────────

test('LOCAL-004: successful transactional build and sampler library load', () => {
  const root = tempRoot();
  try {
    buildAndCommitFixture(root);
    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('test-lib');

    assert.equal(result.ok, true);
    assert.equal(result.libraryId, 'test-lib');
    assert.equal(result.name, 'Test Library Fixture');
    assert.equal(result.schemaVersion, PRODUCT_SCHEMA_VERSION);
    assert.equal(result.instruments.length, 1);
    assert.equal(result.instruments[0].instrumentId, 'inst-oud-001');
    assert.equal(result.instruments[0].samples.length, 1);
    assert.equal(result.instruments[0].samples[0].id, 'oud-c4');
    assert.ok(
      result.instruments[0].samples[0].resolvedPath.includes('oud-c4.test-fixture.wav'),
      'resolved path must reference the sample file',
    );
  } finally {
    cleanup(root);
  }
});

// ─── 2. Isolated temporary productRoot ──────────────────────────────────────

test('LOCAL-004: isolated temporary productRoot', () => {
  const root = tempRoot('uaos-004-isolated');
  try {
    buildAndCommitFixture(root, 'isolated-lib');
    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('isolated-lib');
    assert.equal(result.ok, true);
    assert.ok(result.instruments[0].samples[0].resolvedPath.startsWith(root));
  } finally {
    cleanup(root);
  }
});

// ─── 3. productRoot with spaces in the path ───────────────────────────────────

test('LOCAL-004: productRoot containing spaces resolves correctly', () => {
  const baseRoot = tempRoot('uaos-004-spaces');
  const root = path.join(baseRoot, 'my lib root with spaces');
  fs.mkdirSync(root, { recursive: true });
  try {
    buildAndCommitFixture(root, 'spaced-lib');
    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('spaced-lib');
    assert.equal(result.ok, true);
    assert.ok(result.instruments[0].samples[0].resolvedPath.includes(root));
  } finally {
    cleanup(baseRoot);
  }
});

// ─── 4. Commit visibility boundary: staged but not yet committed ──────────────

test('LOCAL-004: loader returns STAGING_LOAD_REJECTED before commit()', () => {
  const root = tempRoot();
  const builder = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'staged-only' });
  try {
    builder.acquireLock();
    builder.beginStaging({ name: 'Not Yet Committed', instruments: [] });

    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('staged-only');

    // The committed manifest does not exist yet; staging manifest does
    assert.equal(result.ok, false);
    assert.equal(result.code, LOAD_ERROR.STAGING_LOAD_REJECTED);
  } finally {
    cleanup(root);
  }
});

// ─── 5. Staging invisibility: committed manifest is absent ────────────────────

test('LOCAL-004: loader returns MANIFEST_NOT_FOUND for non-existent library', () => {
  const root = tempRoot();
  try {
    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('does-not-exist');
    assert.equal(result.ok, false);
    assert.equal(result.code, LOAD_ERROR.MANIFEST_NOT_FOUND);
  } finally {
    cleanup(root);
  }
});

// ─── 6. Missing manifest ─────────────────────────────────────────────────────

test('LOCAL-004: MANIFEST_NOT_FOUND when library directory has no manifest.json', () => {
  const root = tempRoot();
  try {
    // Create the library dir but do not place a manifest
    fs.mkdirSync(path.join(root, 'empty-lib'), { recursive: true });
    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('empty-lib');
    assert.equal(result.ok, false);
    assert.equal(result.code, LOAD_ERROR.MANIFEST_NOT_FOUND);
  } finally {
    cleanup(root);
  }
});

// ─── 7. Malformed manifest ────────────────────────────────────────────────────

test('LOCAL-004: MANIFEST_MALFORMED when manifest.json contains invalid JSON', () => {
  const root = tempRoot();
  try {
    const libDir = path.join(root, 'bad-manifest-lib');
    fs.mkdirSync(libDir, { recursive: true });
    fs.writeFileSync(path.join(libDir, MANIFEST_FILE_NAME), '{ this is not json }');

    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('bad-manifest-lib');
    assert.equal(result.ok, false);
    assert.equal(result.code, LOAD_ERROR.MANIFEST_MALFORMED);
  } finally {
    cleanup(root);
  }
});

// ─── 8. Unsupported schema version ───────────────────────────────────────────

test('LOCAL-004: UNSUPPORTED_SCHEMA when manifest.json has an unrecognised schemaVersion', () => {
  const root = tempRoot();
  try {
    const libDir = path.join(root, 'future-schema-lib');
    fs.mkdirSync(libDir, { recursive: true });
    const manifest = {
      format: 'UAOS_LOCAL_LIBRARY_INDEX',
      schemaVersion: '99.0.0',
      version: '1.0.0',
      libraryId: 'future-schema-lib',
      builtAt: new Date().toISOString(),
      libraries: [],
    };
    fs.writeFileSync(path.join(libDir, MANIFEST_FILE_NAME), JSON.stringify(manifest));

    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('future-schema-lib');
    assert.equal(result.ok, false);
    assert.equal(result.code, LOAD_ERROR.UNSUPPORTED_SCHEMA);
    assert.ok(result.message.includes('99.0.0'));
  } finally {
    cleanup(root);
  }
});

// ─── 9. Missing sample file ───────────────────────────────────────────────────

test('LOCAL-004: SAMPLE_NOT_FOUND when a sample file is absent', () => {
  const root = tempRoot();
  try {
    // Build and commit without placing sample files
    const builder = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'missing-sample-lib' });
    builder.acquireLock();
    builder.beginStaging({ name: 'Missing Sample Lib', instruments: [fixtureInstrument()] });
    // Intentionally do NOT write sample files
    builder.commit();
    builder.releaseLock();

    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('missing-sample-lib');
    assert.equal(result.ok, false);
    assert.equal(result.code, LOAD_ERROR.SAMPLE_NOT_FOUND);
    assert.equal(result.sampleId, 'oud-c4');
  } finally {
    cleanup(root);
  }
});

// ─── 10. Invalid relative preset path ────────────────────────────────────────

test('LOCAL-004: PATH_TRAVERSAL rejected for presetPath containing ".."', () => {
  const root = tempRoot();
  try {
    const builder = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'traversal-lib' });
    builder.acquireLock();
    assert.throws(
      () => builder.beginStaging({
        name: 'Traversal Lib',
        instruments: [fixtureInstrument({ presetPath: '../../../etc/passwd' })],
      }),
      (err) => err.message.includes('..'),
    );
  } finally {
    cleanup(root);
  }
});

// ─── 11. Path traversal via sampleFile ───────────────────────────────────────

test('LOCAL-004: PATH_TRAVERSAL rejected for sampleFile containing ".."', () => {
  const root = tempRoot();
  try {
    const builder = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'sample-traversal-lib' });
    builder.acquireLock();
    const badInst = fixtureInstrument({
      samples: [{ id: 's1', sampleFile: '../../outside/evil.wav', rootKey: 60, keyLow: 0, keyHigh: 127, velocityLow: 1, velocityHigh: 127 }],
    });
    assert.throws(
      () => builder.beginStaging({ name: 'Sample Traversal Lib', instruments: [badInst] }),
      (err) => err.message.includes('..'),
    );
  } finally {
    cleanup(root);
  }
});

// ─── 12. Rollback preserves prior committed product ──────────────────────────

test('LOCAL-004: rollback preserves the previously committed product', () => {
  const root = tempRoot();
  try {
    // Commit version 1
    buildAndCommitFixture(root, 'rollback-lib');

    // Start a new build but roll it back
    const builder2 = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'rollback-lib' });
    builder2.acquireLock();
    builder2.beginStaging({ name: 'Version 2 (rolled back)', instruments: [] });
    builder2.rollback();
    builder2.releaseLock();

    // Committed v1 manifest must still be readable
    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary('rollback-lib');
    assert.equal(result.ok, true);
    assert.equal(result.name, 'Test Library Fixture');
  } finally {
    cleanup(root);
  }
});

// ─── 13. Active lock rejection ────────────────────────────────────────────────

test('LOCAL-004: active build lock prevents a conflicting build', () => {
  const root = tempRoot();
  try {
    const builder1 = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'locked-lib' });
    builder1.acquireLock();

    const builder2 = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'locked-lib' });
    assert.throws(
      () => builder2.acquireLock({ staleAfterMs: 60_000 }),
      BuildLockError,
    );
  } finally {
    cleanup(root);
  }
});

// ─── 14. Stale lock handling ──────────────────────────────────────────────────

test('LOCAL-004: stale lock is removed and a new build can proceed', () => {
  const root = tempRoot();
  try {
    const libraryDir = path.join(root, 'stale-lock-lib');
    fs.mkdirSync(libraryDir, { recursive: true });

    // Write a lock that is 2 minutes old
    const staleLock = {
      lockedAt: new Date(Date.now() - 120_000).toISOString(),
      pid: 99999,
    };
    fs.writeFileSync(path.join(libraryDir, '.build-lock'), JSON.stringify(staleLock));

    const builder = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'stale-lock-lib' });
    // Should not throw — the stale lock is removed and a new one acquired
    assert.doesNotThrow(() => builder.acquireLock({ staleAfterMs: 60_000 }));
  } finally {
    cleanup(root);
  }
});

// ─── 15. Interrupted journal recovery ────────────────────────────────────────

test('LOCAL-004: interrupted staging transaction is recovered via journal', () => {
  const root = tempRoot();
  try {
    const libraryId = 'recovery-lib';
    const builder = new TransactionalLibraryBuilder({ productRoot: root, libraryId });

    builder.acquireLock();
    builder.beginStaging({ name: 'Interrupted Build', instruments: [] });
    // Simulate interrupted process: do NOT call commit() or rollback()

    // Staging dir should exist
    assert.ok(fs.existsSync(path.join(root, libraryId, '.staging')));

    // Recover
    const recovery = TransactionalLibraryBuilder.recoverFromJournal({ productRoot: root, libraryId });
    assert.equal(recovery.action, 'rolled-back');

    // Staging dir should be gone
    assert.equal(fs.existsSync(path.join(root, libraryId, '.staging')), false);

    // Journal should record RECOVERED_ROLLBACK state
    const journal = JSON.parse(
      fs.readFileSync(path.join(root, libraryId, '.journal.json'), 'utf8'),
    );
    assert.equal(journal.state, 'RECOVERED_ROLLBACK');
  } finally {
    cleanup(root);
  }
});

// ─── 16. Journal cleanup after successful commit ──────────────────────────────

test('LOCAL-004: journal records COMMITTED state after successful commit', () => {
  const root = tempRoot();
  try {
    buildAndCommitFixture(root, 'journal-commit-lib');
    const journal = JSON.parse(
      fs.readFileSync(path.join(root, 'journal-commit-lib', '.journal.json'), 'utf8'),
    );
    assert.equal(journal.state, 'COMMITTED');
    assert.ok(journal.committedAt);
  } finally {
    cleanup(root);
  }
});

// ─── 17. Windows path-separator normalisation ─────────────────────────────────

test('LOCAL-004: Windows backslash paths in manifest are normalised to forward-slash', () => {
  // normalizePath must convert backslash paths to forward-slash paths
  const normalized = normalizePath('samples\\oud-c4.wav');
  assert.equal(normalized, 'samples/oud-c4.wav');

  // Building with a Windows-style presetPath should succeed
  const root = tempRoot();
  try {
    const builder = new TransactionalLibraryBuilder({ productRoot: root, libraryId: 'win-path-lib' });
    builder.acquireLock();

    const inst = fixtureInstrument({
      presetPath: 'instruments\\oud.json',         // backslash
      samples: [
        {
          id: 'oud-c4',
          sampleFile: 'samples\\oud-c4.test-fixture.wav', // backslash
          rootKey: 60,
          keyLow: 0,
          keyHigh: 127,
          velocityLow: 1,
          velocityHigh: 127,
        },
      ],
    });

    // beginStaging should not throw — backslashes are normalised
    assert.doesNotThrow(() => builder.beginStaging({ name: 'Win Path Lib', instruments: [inst] }));
  } finally {
    cleanup(root);
  }
});

// ─── 18. Unicode library ID ───────────────────────────────────────────────────

test('LOCAL-004: library with a Unicode identifier loads correctly', () => {
  const root = tempRoot();
  const libraryId = 'lib-عود'; // Unicode in the library ID
  try {
    const builder = new TransactionalLibraryBuilder({ productRoot: root, libraryId });
    builder.acquireLock();

    const instruments = [fixtureInstrument()];
    builder.beginStaging({ name: 'Unicode Oud Library', instruments });

    const stagingDir = path.join(root, libraryId, '.staging');
    writeFixtureWav(path.join(stagingDir, 'samples', 'oud-c4.test-fixture.wav'));

    builder.commit();
    builder.releaseLock();

    const loader = new SamplerLibraryLoader({ productRoot: root });
    const result = loader.loadLibrary(libraryId);
    assert.equal(result.ok, true);
    assert.equal(result.libraryId, libraryId);
  } finally {
    cleanup(root);
  }
});

// ─── 19. Fixture is visibly non-commercial ───────────────────────────────────

test('LOCAL-004: instrument preset legal field marks fixture as non-commercial', () => {
  const root = tempRoot();
  try {
    buildAndCommitFixture(root, 'legal-check-lib');
    const presetPath = path.join(root, 'legal-check-lib', 'instruments', 'oud.json');
    const preset = JSON.parse(fs.readFileSync(presetPath, 'utf8'));

    assert.equal(preset.legal.commercialCopy, false);
    assert.ok(typeof preset.legal.notes === 'string' && preset.legal.notes.length > 0);
  } finally {
    cleanup(root);
  }
});

// ─── 20. Temporary staging directory is cleaned up after commit ───────────────

test('LOCAL-004: staging directory is removed after commit()', () => {
  const root = tempRoot();
  try {
    buildAndCommitFixture(root, 'cleanup-lib');
    const stagingDir = path.join(root, 'cleanup-lib', '.staging');
    assert.equal(fs.existsSync(stagingDir), false, 'staging dir must not exist after commit');
    const manifestPath = path.join(root, 'cleanup-lib', MANIFEST_FILE_NAME);
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist after commit');
  } finally {
    cleanup(root);
  }
});

// ─── 21. Absolute sample path in manifest is rejected ────────────────────────

test('LOCAL-004: absolute sampleFile path is rejected by path safety', () => {
  assert.throws(
    () => normalizePath('/etc/passwd', 'sampleFile'),
    (err) => err.message.includes('relative'),
  );
  assert.throws(
    () => normalizePath('C:\\Windows\\System32\\evil.dll', 'sampleFile'),
    (err) => err.message.includes('relative') || err.message.includes('absolute'),
  );
});

// ─── 22. nothing-to-recover when no journal exists ────────────────────────────

test('LOCAL-004: recoverFromJournal returns nothing-to-recover when no journal exists', () => {
  const root = tempRoot();
  try {
    const result = TransactionalLibraryBuilder.recoverFromJournal({
      productRoot: root,
      libraryId: 'no-journal-lib',
    });
    assert.equal(result.action, 'nothing-to-recover');
  } finally {
    cleanup(root);
  }
});
