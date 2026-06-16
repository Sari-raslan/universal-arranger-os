# Architecture Decisions

1. V1 remains stable; new engines are feature-flagged.
2. UMS is the canonical intermediate representation.
3. Flow: Input -> Analysis Providers -> UMS -> Export Adapters.
4. Open/testable exports come before proprietary formats.
5. Every AI result carries provider, version, confidence, and warnings.
6. User uploads are private and never train global models by default.
7. Device support states are Planned, Experimental, or Verified.
8. Verification requires physical hardware or trusted fixtures.
