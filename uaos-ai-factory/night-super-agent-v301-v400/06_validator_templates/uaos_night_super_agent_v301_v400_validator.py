from pathlib import Path
import json, re

RUN = Path(__file__).resolve().parents[1]
RESULT = RUN / "06_validator_templates" / "UAOS_NIGHT_SUPER_AGENT_V301_V400_RESULTS.json"
FORBIDDEN_EXTS = (".sty", ".set", ".prs", ".prf", ".kst")

def exists(rel):
    p = RUN / rel
    return {"pass": p.exists(), "detail": str(p)}

def count_files(folder, pattern="*"):
    return len(list((RUN / folder).glob(pattern)))

def draft_plans_exist():
    missing = [v for v in range(301, 401) if not (RUN / "03_draft_pipeline" / f"UAOS_V{v}_DRAFT_PLAN.md").exists()]
    return {"pass": not missing, "detail": missing or "100 draft plans"}

def future_versions_draft_not_run():
    bad = []
    for v in range(301, 401):
        p = RUN / "03_draft_pipeline" / f"UAOS_V{v}_DRAFT_PLAN.md"
        t = p.read_text(encoding="utf-8")
        required = ['status: "DRAFT_NOT_RUN"', 'pass_claim_allowed: false', 'real_writer_allowed: false', 'korg_output_allowed: false', 'sty_set_generation_allowed: false', 'usb_allowed: false', 'pa3x_allowed: false']
        for item in required:
            if item not in t:
                bad.append(f"V{v}:{item}")
    return {"pass": not bad, "detail": bad or "all draft locked"}

def no_future_pass_claims():
    bad = []
    allowed_phrases = ["PASS/FAIL", "pass_claim_allowed: false", "No future PASS claim", "future PASS claim", "future_pass_claim_allowed", "future versions marked PASS: NO"]
    scan_roots = [RUN / "01_agents", RUN / "02_agent_outputs", RUN / "03_draft_pipeline", RUN / "04_batch_blueprints", RUN / "05_integrator_queue"]
    for root in scan_roots:
        for p in root.rglob("*"):
            if p == Path(__file__).resolve():
                continue
            if p.is_file() and p.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
                t = p.read_text(encoding="utf-8", errors="ignore")
                scrubbed = t
                for phrase in allowed_phrases:
                    scrubbed = scrubbed.replace(phrase, "")
                if " PASS" in scrubbed or ": PASS" in scrubbed or "PASS " in scrubbed:
                    bad.append(str(p.relative_to(RUN)))
    return {"pass": not bad, "detail": bad or "no future pass claims"}

def no_forbidden_files():
    hits = [str(p.relative_to(RUN)) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN_EXTS]
    return {"pass": not hits, "detail": hits or "none"}

def no_unsafe_positive_actions():
    unsafe = []
    patterns = [r"real_writer_allowed:\s*true", r"korg_output_allowed:\s*true", r"sty_set_generation_allowed:\s*true", r"usb_allowed:\s*true", r"pa3x_allowed:\s*true", r"deploy_allowed\"\s*:\s*true", r"payment.*active", r"future_versions_executed\"\s*:\s*true"]
    for p in RUN.rglob("*"):
        if p == Path(__file__).resolve():
            continue
        if p == RESULT:
            continue
        if p.is_file() and p.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
            t = p.read_text(encoding="utf-8", errors="ignore")
            for pat in patterns:
                if re.search(pat, t, re.IGNORECASE):
                    unsafe.append(f"{p.relative_to(RUN)}:{pat}")
    return {"pass": not unsafe, "detail": unsafe or "no unsafe positive actions"}

def no_exact_false_claims():
    c1 = "KORG" + "-compatible"
    c2 = "PA3X" + "-ready"
    hits = []
    for p in RUN.rglob("*"):
        if p == Path(__file__).resolve():
            continue
        if p.is_file() and p.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
            t = p.read_text(encoding="utf-8", errors="ignore")
            if c1 in t or c2 in t:
                hits.append(str(p.relative_to(RUN)))
    return {"pass": not hits, "detail": hits or "absent"}

checks = {
    "launcher_exists": exists("00_launcher/RUN_UAOS_NIGHT_SUPER_AGENT_V301_V400.cmd"),
    "agents_exist": {"pass": count_files("01_agents", "AGENT_*.md") == 12, "detail": count_files("01_agents", "AGENT_*.md")},
    "agent_outputs_exist": {"pass": count_files("02_agent_outputs", "agent_*" ) == 12, "detail": count_files("02_agent_outputs", "agent_*")},
    "v301_v400_draft_plans_exist": draft_plans_exist(),
    "batch_blueprints_exist": {"pass": count_files("04_batch_blueprints", "*.md") == 5, "detail": count_files("04_batch_blueprints", "*.md")},
    "integrator_queue_exists": exists("05_integrator_queue/UAOS_V301_V400_INTEGRATOR_QUEUE.json"),
    "future_versions_draft_not_run": future_versions_draft_not_run(),
    "no_future_pass_claims": no_future_pass_claims(),
    "no_real_writer_implementation": no_unsafe_positive_actions(),
    "no_generated_korg_output": no_forbidden_files(),
    "no_sty_set_generated": no_forbidden_files(),
    "no_prs_prf_kst_generated": no_forbidden_files(),
    "no_usb_pa3x_deploy_payment_positive_action": no_unsafe_positive_actions(),
    "no_exact_false_claims": no_exact_false_claims(),
}
errors = [k for k,v in checks.items() if not v["pass"]]
result = {"checks": checks, "errors": errors, "status": "PASS" if not errors else "FAIL", "pass": not errors}
RESULT.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
raise SystemExit(0 if not errors else 1)
