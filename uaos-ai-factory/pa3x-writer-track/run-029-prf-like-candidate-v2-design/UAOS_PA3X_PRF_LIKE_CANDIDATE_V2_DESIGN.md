# UAOS PA3X PRF-like Candidate V2 Design

Status: TEST_UNVERIFIED / DO NOT LOAD

V2 design goal:
Create a more realistic local-only PRF-like candidate than V1 while avoiding fixture bytes, audio/sample data, personal data, and any compatibility claim.

Structural lessons used:
- PRF parser v1 confidence: 0.915
- Stable-offset validation confidence: 0.915
- Reference PRF range: 21975-32230 bytes
- Generic marker observed in reports: `KORF`

V2 changes:
- Size increased to 4096 bytes.
- Binary sparse layout instead of plain text file.
- Generic `KORF` marker appears at planned structural offsets.
- Region labels are synthetic only: header, metadata, region placeholders, footer marker.

No fixture bytes are copied. `KORF` is used only as a documented generic structural marker from reports, not as copied proprietary data.
