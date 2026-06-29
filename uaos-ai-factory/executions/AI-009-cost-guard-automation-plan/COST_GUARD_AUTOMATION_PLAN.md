# AI-009 Cost Guard Automation Plan

Status: DONE_LOCAL_PLAN_ONLY

This plan protects Code X/Codex usage and future automation spend. It does not enable external automation, billing API access, background agents, payment flows, deploys, or writer/export output.

## Core Rules

- Protect Code X/Codex credits by using it only for complex senior engineering work.
- Route cheap tasks to local scripts, manual work, or lower-cost workers where safe.
- Keep one small task active at a time.
- Require a report after each task.
- Stop at the first serious FAIL.
- Block whole repo scans.
- Block loops and open-ended prompts.
- Block broad "do everything" tasks.
- Require owner approval before any external automation.
- Allow no autonomous spending.

## Future Automation Shape

Future cost guard automation may classify tasks before execution, select the cheapest safe worker, and write a daily cost report. It must remain blocked until the owner explicitly approves external automation and budget expansion.
