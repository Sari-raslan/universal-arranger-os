# UAOS Cycle 006 Plugin Interface Rules

Status: READY

## Purpose

Define safe plugin interfaces for UAOS product modules without adding runtime execution, deployment, frontend changes, or restricted outputs.

## Plugin Boundary

Each plugin may:

- Read approved JSON/markdown metadata.
- Write JSON, markdown, or text reports.
- Declare input and output schemas.
- Declare safety gates.
- Declare owner approval requirements.

Each plugin may not:

- Deploy.
- Use Vercel.
- Add money-flow features.
- Create keyboard output or transfer paths.
- Copy proprietary samples.
- Edit App.jsx without owner approval.

## Recommended Plugin Types

- Validator plugin.
- Arranger planner plugin.
- Library metadata plugin.
- Monitor data plugin.
- QA reporter plugin.
- Owner dashboard plugin.

## Tomorrow Implementation

Create sample manifests for validator, arranger planner, and library metadata plugins, then validate them with a JSON-only manifest validator.
