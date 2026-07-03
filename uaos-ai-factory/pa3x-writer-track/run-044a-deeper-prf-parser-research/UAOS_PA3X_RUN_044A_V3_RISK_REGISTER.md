# UAOS PA3X Run 044A V3 Risk Register

Status: PASS - RISK REGISTER ONLY

| Risk | Severity | Current Evidence | Mitigation |
| --- | --- | --- | --- |
| Device rejects V3 | Medium | No PA3X observation exists | Treat rejection as valid result; do not retry unsafely |
| Unknown checksum or footer | High | No decoded checksum model | Parser v2 must identify footer/check regions read-only |
| Synthetic body differs from native PRF | High | Variable and repeated regions are not decoded | Do not generate V4 binary until design-only review passes |
| Missing Run 033 evidence | Medium | Expected Run 033 folder not found | Recreate binary-inspection report from committed artifacts only if approved |
| Stable offsets overgeneralized | Medium | Only three anchors are high-confidence | Keep anchors read-only and avoid writer claims |
| Fixture provenance ambiguity | Medium | Owner fixture folder is currently untracked in git status | Preserve read-only handling and avoid fixture edits |
| Accidental hardware path escalation | High | USB workflow exists in prior runs | Do not run copy script; keep approval gates separate |

## Risk Position

V3 remains a local TEST_UNVERIFIED experiment, not a verified keyboard file.
