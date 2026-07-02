# UAOS PA3X PRF V2 Mismatch Analysis 031

Status: RESEARCH ONLY

Why V2 scored 0.725:
- Manifest safety, extension/label, and generic header markers scored strongly.
- Region markers scored `0.0` in Run 030, meaning V2 markers did not satisfy the structural expectations used by the inspection.
- Size closeness scored `0.25` because V2 was 4096 bytes, only 0.1864 of the smallest reference PRF and 0.1529 of the average reference PRF.
- Reference parser confidence was 0.915, but that confidence only supports structural research, not a device-use claim.

What V3 must change:
- Increase candidate size toward the observed PRF range: minimum 21975 bytes, recommended research target 24576 bytes.
- Make region markers line up with stable offsets from Run 010: [0, 17, 23].
- Represent header, stable regions, variable regions, repeated regions, and unknown regions explicitly.
- Keep all content synthetic and TEST_UNVERIFIED.
- Do not copy fixture bytes, audio/sample data, or personal data.

Conclusion:
V3 generation can be approved next only as a local TEST_UNVERIFIED candidate requiring another binary safety inspection. No USB or keyboard transfer should be approved yet.
