# UAOS Product Core Architecture - Run 003

Status: PASS

Purpose: define practical UAOS product boundaries that can move forward without touching `App.jsx`.

## Core Modules

1. Runtime Core
   - Holds project session state, validation state, safety gates, and orchestration context.
   - Owns read/write contracts for safe JSON metadata only.

2. Arranger Intelligence
   - Converts song ideas into arrangement plans.
   - Produces sections, suggested energy curves, maqam-aware hints, and library-aware instrument choices.
   - Output remains plan/spec data only until owner approves implementation paths.

3. Library Factory
   - Owns original library metadata, instrument categories, articulation maps, recording plans, and quality tiers.
   - Does not include proprietary sample content.

4. Oriental Strings Identity Layer
   - Defines eastern strings articulations, maqam behavior metadata, ornaments, and expression rules.
   - Stores quarter-tone and maqam metadata only.

5. Live Monitor Data
   - Publishes owner-readable progress data, agent status, blockers, and next actions.
   - No deploy action in this run.

6. UI Layer
   - Reads prepared product data and renders dashboards.
   - Any direct UI wiring in `App.jsx` requires later owner approval.

## Safe Plugin Architecture

- Plugin manifests are JSON-only.
- Each plugin declares `id`, `capabilities`, `inputSchemas`, `outputSchemas`, `safetyGates`, and `ownerApprovalRequired`.
- Plugins cannot emit restricted hardware-native files.
- Plugins cannot contain third-party sample claims.
- Plugins can generate plans, metadata, QA reports, and test-case data.

## Can Be Implemented Without App.jsx

- JSON schemas for arranger plans, library metadata, monitor status, and QA gates.
- Markdown policies and owner dashboards.
- Data samples for later UI use.
- Unit-test fixtures for arranger rules and library metadata validation.

## Requires App.jsx Approval Later

- Any visible UI route, dashboard widget, or navigation change.
- Any browser-side state integration.
- Any live monitor frontend rendering changes.
- Any clickable export button.

## Product Progress From Run 003

Run 003 creates the safe product data layer needed for future implementation. It does not claim production readiness and does not ship restricted output.
