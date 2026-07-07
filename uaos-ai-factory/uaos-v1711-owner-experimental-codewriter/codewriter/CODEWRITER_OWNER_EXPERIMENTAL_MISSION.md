# UAOS V1711 CodeWriter Mission - Owner Experimental

## Executive instruction

Continue UAOS as **MegaLauncher, one script**.

Use this file as the CodeWriter mission for the next local senior-engineer pass. The current script has already moved the project into the owner experimental workspace path:

$PhaseRoot

## Stage

- Stage: OWNER_EXPERIMENTAL_CODEWRITER
- Writer mode: OWNER_EXPERIMENTAL_CODEWRITER_METADATA_ONLY
- writer_ready: false
- Safe copy allowed: 0
- Source file copy: NO
- Real keyboard binary writer: NO
- Keyboard package output: NO
- USB write: NO
- Hardware load: NO
- Deploy/payment: NO

## Fix applied by this launcher

The failed V1708/V1710 run broke because the previous script assumed a fixed JSON shape and used fragile PowerShell pipeline generation around extension summaries.

This V1711 launcher fixes that by:

1. Loading JSON inventory through a loose parser.
2. Extracting rows from common keys like rows/files/items/blocked_files/inventory.
3. Falling back to direct metadata scan when the JSON inventory is absent or malformed.
4. Counting collections through normalized arrays, not through a required JSON .Count property.
5. Building owner option/summary sections through explicit oreach loops.

## CodeWriter allowed edits

- Keep all generated files inside uaos-ai-factory/uaos-v1711-owner-experimental-codewriter.
- The only root-level allowed project doc is docs/UAOS_OWNER_EXPERIMENTAL_STAGE.md.
- Keep the MegaLauncher script as the single entry point:
  uaos-ai-factory/RUN_UAOS_V1711_OWNER_EXPERIMENTAL_CODEWRITER_MEGALAUNCHER.ps1

## CodeWriter forbidden edits

- Do not copy, transform, decode, export, or regenerate proprietary keyboard files.
- Do not create any forbidden keyboard extension output.
- Do not switch writer_ready to true.
- Do not write USB.
- Do not load hardware.
- Do not deploy.
- Do not enable payment.
- Do not make production compatibility claims.

## Acceptance

The owner experimental handoff is acceptable when:

- UAOS_V1711_VALIDATION.json reports OWNER_EXPERIMENTAL_READY.
- UAOS_V1711_OWNER_EXPERIMENTAL_WORKSPACE.html opens locally.
- Owner decisions can be exported as CSV.
- UAOS_V1711_FINAL_OWNER_EXPERIMENTAL_SEAL.md exists.
- The package zip exists and has a SHA256 hash.

