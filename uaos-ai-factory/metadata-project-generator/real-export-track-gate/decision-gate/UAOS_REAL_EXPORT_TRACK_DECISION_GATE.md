# UAOS Real Export Track Decision Gate

status: "PASS_PENDING_OWNER_DECISION"
local_only: true
planning_gate_only: true
korg_output_created: false
midi_created_in_this_run: false

## Export Levels

### Level 1: Real MIDI Export
- status: "SAFE_CANDIDATE_REQUIRES_OWNER_APPROVAL"
- output: `.mid` in a future approved run
- risk: low/medium
- KORG output: false

### Level 2: UAOS Project Package Export
- status: "SAFE_CANDIDATE_REQUIRES_OWNER_APPROVAL"
- output: `.uaos.json` or `.json` package in a future approved run
- risk: low
- KORG output: false

### Level 3: Generic Style Package Export
- status: "SAFE_CANDIDATE_REQUIRES_OWNER_APPROVAL"
- output: `.zip` containing JSON/MD/MIDI later
- risk: medium
- KORG output: false

### Level 4: KORG Research Only
- status: "RESEARCH_ONLY"
- output: reports only
- risk: medium/high
- KORG writer: false

### Level 5: KORG Writer Sandbox
- status: "BLOCKED_REQUIRES_EXPLICIT_OWNER_APPROVAL"
- output: sandbox test files only
- risk: high
- real keyboard load: false

### Level 6: Real KORG Export
- status: "BLOCKED_NOT_ALLOWED_NOW"
- output: `.STY`/`.SET` future only
- risk: high
- requires explicit separate approval
