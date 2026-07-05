from pathlib import Path
import json, subprocess, sys
root = Path(r"E:\keyboard-manager-clean")
run = root / "uaos-ai-factory" / "real-writer-roadmap-owner-gate"
results = {"checks": {}, "errors": []}
def check(name, ok, detail=""):
    results["checks"][name] = {"pass": bool(ok), "detail": detail}
    if not ok:
        results["errors"].append(f"{name}: {detail}")
check("roadmap_exists", (run/"roadmap"/"UAOS_REAL_KORG_WRITER_ROADMAP.md").exists() and (run/"roadmap"/"UAOS_REAL_KORG_WRITER_ROADMAP.json").exists(), "roadmap")
check("fixture_gate_exists", (run/"fixture-gate"/"UAOS_REQUIRED_OWNER_FIXTURE_GATE.md").exists() and (run/"fixture-gate"/"UAOS_FIXTURE_APPROVAL_FORM.json").exists(), "fixture gate")
check("writer_gate_exists", (run/"writer-gate"/"UAOS_WRITER_BLOCKED_NOW.md").exists() and (run/"writer-gate"/"UAOS_WRITER_UNLOCK_REQUIREMENTS.md").exists(), "writer gate")
check("usb_pa3x_gate_exists", (run/"usb-pa3x-gate"/"UAOS_USB_WORKFLOW_GATE.md").exists() and (run/"usb-pa3x-gate"/"UAOS_PA3X_LOAD_GATE.md").exists(), "usb/pa3x gate")
cp = subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
react_touched = bool(cp.stdout.strip())
check("build_pass_if_react_touched", not react_touched, "React card not added")
text = ""
for f in run.rglob("*"):
    if f.name == "uaos_real_writer_roadmap_validator.py":
        continue
    if f.is_file() and f.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
        text += f.read_text(encoding="utf-8", errors="ignore") + "\n"
writer_impl_terms = ["function writeKorg", "class KorgWriter", "writeKorgFile(", "encodeKorgBinary("]
check("no_writer_implementation", not any(term in text for term in writer_impl_terms), "roadmap only")
unsafe = [str(p) for p in run.rglob("*") if p.suffix.lower() in {".sty", ".set", ".prs", ".prf", ".kst"}]
check("no_blocked_korg_files_generated", not unsafe, ", ".join(unsafe))
check("no_usb_write", "USB write now: NO" in text and "USB write: YES" not in text, "USB blocked")
check("no_pa3x_load", "PA3X load now: NO" in text and "PA3X load: YES" not in text, "PA3X blocked")
claim1 = "KORG-" + "compatible"
claim2 = "PA3X-" + "ready"
check("no_false_claim_strings", claim1 not in text and claim2 not in text, "claim strings absent")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy commands")
results["pass"] = not results["errors"]
results["validator"] = "uaos_real_writer_roadmap_validator.py"
(run/"validators"/"UAOS_REAL_WRITER_ROADMAP_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
