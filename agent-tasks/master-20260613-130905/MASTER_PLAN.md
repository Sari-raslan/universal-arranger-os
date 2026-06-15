# UAOS Remaining Work Master Plan

## Execution order

1. Preserve current verified Library, Sampler UI, MIDI input, tests, and runtime.
2. Implement local WAV sample import and preset format.
3. Add ADSR, gain, pan, filter, and sample voice lifecycle.
4. Validate MIDI hardware manually.
5. Complete open arranger engine and internal style format.
6. Expand Studio/DAW routing and offline export.
7. Harden Electron and Android packaging.
8. Complete accessibility and translations.
9. Run the full V1 release gate.
10. Commit and open a PR only after explicit user approval.
11. Merge and deploy only after a separate explicit approval.

## Writer rule

Parallel agents may inspect and report. Only the coordinator applies file changes,
one phase at a time, to avoid package and source corruption.

## Current safety state

- No automatic commit.
- No automatic push.
- No automatic merge.
- No automatic deploy.
- No SysEx.
- No MIDI output.
- No commercial samples copied into Git.