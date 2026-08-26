# UAOS Commander — Technical Sheet (2 pages, EN)

## Page 1 — Product & architecture

**Product:** UAOS Commander (Windows desktop)  
**Positioning:** Local-first Mission Control for AI agents, automations and software programs  
**Tagline:** COMMAND. CONTROL. EXCEL.

### Architecture summary
| Layer | Behaviour |
|---|---|
| Control plane | Local Electron app; userData on buyer machine |
| Agents | BYO — detect installed CLIs; never invent availability |
| Approvals | Restricted ops require explicit one-time owner approval |
| Evidence | Per-task records persist across restart |
| Adapters (1.1 hardening) | READ-ONLY normalized contract; Generic JSON/MCP/HTTP first; GitHub/Linear/n8n stubs |
| Observability | Local-first runs/history; UNKNOWN≠0; cost marked PROVIDER_REPORTED or ESTIMATED |
| Program Tree | Separate runtime; Commander observes until safe handover — never a second writer by default |

### Security / privacy defaults
- No mandatory UAOS cloud account
- No telemetry/analytics in Founding Pilot packaging claims
- Diagnostics redact API keys, tokens, Authorization, owner paths
- Checkout / payment / public binary remain OFF until gated

### System requirements (summary)
Windows x64 · sufficient disk for userData · optional CLI agents installed by buyer

---

## Page 2 — Commercial, distribution, limits

### Pricing (public Founding Pilot — do not auto-change)
EUR **29.99** one-time · internal validation ≤10 qualified B2B · future test range EUR 79–149 after proven usage · no subscription unless a recurring service later justifies it

### Licence defaults (offer truth)
Non-exclusive · non-transferable · internal business use · 1 named user · up to 2 Windows devices · BYO-AI costs on buyer · major version + 12 months bugfix/minor · future majors not auto-included · 30 days email onboarding support best-effort (no SLA)

### Distribution trust path
Preferred: current-version **MSIX** + Microsoft Store signing/certification  
Fallback: trusted legitimate code-signing  
Not commercial default: self-signed or unsigned production package

### Honest limitations (do not market as present)
Enterprise SSO · enterprise RBAC · hundreds of integrations · auto cloud sync · live payment in-app · Asana/Jira replacement claims

### Proof anchors
1.0.1 frozen: HEAD d90446d · 959/0/4/963 · handoff ZIP SHA256 `98507F2003D4F2353A8AA89FEAF73558DD7D8B3458C582A21C65B2839CE6E984`

### Contact / legal gates
admin@aeplatform.app  
Legal gates remain explicit (withdrawal, refund, warranty/liability, terms, digital early-delivery consent) — **not fabricated clearance**
