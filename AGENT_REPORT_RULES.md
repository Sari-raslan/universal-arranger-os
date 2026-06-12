UAOS AGENT DAILY REPORT FORMAT

Every agent must write a report after finishing each task.

Report file:
agent-output/UAOS_AGENT_STATUS_BOARD.md

Each agent must include:

## Agent Name
Cursor / VS Code / PowerShell / Android Studio / Vercel / Claude if available

## Current Status
- Running
- Finished
- Blocked
- Waiting for user

## What I finished
- ...

## What I am doing now
- ...

## What is next
- ...

## Blocking problems
- ...

## Estimated effort
Use only rough estimates:
- Small: less than 30 min
- Medium: 1-3 hours
- Large: 1 day+
- External dependency: requires account/device/Mac/payment/USB

## Files changed
- ...

## Commands run
- ...

## Build/Test result
- PASS / FAIL

Rules:
- Do not guess success.
- If something needs Apple account, Stripe, USB authorization, Android device, or Mac/Xcode, mark it BLOCKED.
- Do not commit generated binaries.
- Keep reports clear and short.
