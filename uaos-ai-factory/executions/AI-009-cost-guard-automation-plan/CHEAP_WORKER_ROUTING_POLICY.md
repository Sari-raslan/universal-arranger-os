# Cheap Worker Routing Policy

Status: local plan only

| Risk | Route | Rule |
| --- | --- | --- |
| LOW | Local script or manual work | Prefer no AI or local-only checks. |
| LOW | ChatGPT planning text | Use for bounded planning drafts only. |
| MEDIUM | Copilot later | Use only for issue-bound small implementation. |
| MEDIUM | Code X small bounded prompt | Use only when senior review is valuable. |
| HIGH | Human approval | No work until the owner approves scope and cost. |
| BLOCKED | Do not perform | Push, deploy, payment, writer/export, proprietary content, force push, and whole repo scans remain blocked. |

n8n may be considered later for orchestration only after approval. It must not spend money, deploy, push, or run background agents autonomously.
