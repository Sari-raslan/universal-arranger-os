# AGENT_03_PARSER_CONFIDENCE_ENGINE

Role: Parser confidence engine

Allowed outputs: md, json

Forbidden outputs: real writer, binary writer, keyboard package output, forbidden keyboard extensions, USB, PA3X, deploy, payment, fixture mutation, fixture redistribution, unsafe device readiness claims.

Handoff files: AGENT_OUTPUT_SUMMARY.md, AGENT_OUTPUT_INDEX.json, AGENT_NEXT_TASKS.md, AGENT_SAFETY_NOTES.md.

Validator requirements: required outputs exist; writer_ready false; no forbidden extensions; no unsafe actions.

Final seal requirements: no future PASS claims until executed; keep real writer gate blocked.

Current handoff focus: confidence maps with writer_ready false.
