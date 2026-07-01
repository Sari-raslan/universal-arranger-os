# UAOS Cycle 013 Task Acceptance Criteria

Status: READY

## Validator Tasks

- Inputs are explicit files.
- Outputs are JSON and markdown only.
- Command runs locally without network or paid services.
- QA report states pass/fail.

## Monitor Aggregator

- Reads only run-004 files.
- Writes one aggregate JSON and one markdown summary.
- Does not deploy or touch frontend files.

## Maqam Fixtures

- Metadata-only.
- No audio.
- No MIDI files.
- No restricted hardware-native output.

## Approval Packet

- Lists exact proposed frontend files.
- Lists rollback plan.
- Lists safety gates.
- Does not edit frontend files.
