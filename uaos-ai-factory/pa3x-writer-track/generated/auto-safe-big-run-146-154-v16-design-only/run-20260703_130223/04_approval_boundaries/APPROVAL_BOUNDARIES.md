# Approval Boundaries

Approval for one boundary does not approve any later boundary.

| Boundary | Meaning | Requires separate approval | Does not approve |
| --- | --- | --- | --- |
| Design-only continuation | Reports, dashboards, manifests, logs, seals only | No hardware approval | Candidate, USB, PA3X load, deploy/payment |
| Candidate creation | One future local-only TEST_UNVERIFIED candidate | Yes, explicit owner text | USB, PA3X load, fixture modification, proprietary content |
| USB verification | Read-only detection of a real empty removable USB | Yes, plus device exists | USB copy, package transfer, Run 037, PA3X load |
| USB copy | Copying files to USB | Yes, future separate approval | PA3X load |
| PA3X load | Keyboard transfer/load workflow | Yes, future separate approval | Compatibility claims without evidence |
| External review pack | Reports-only review materials | Owner instruction | External copy unless separately approved |
| Public/deploy/payment | Release or monetization activity | Separate explicit approval | Any technical safety gate |
