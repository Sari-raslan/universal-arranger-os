#!/usr/bin/env python3
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
required = {"app_html": ROOT/"01_app"/"UAOS_PC_WORKSTATION_MVP_V1.html", "writer": ROOT/"02_writer_engine"/"uaos_pc_writer_v1.py", "uaosproj": ROOT/"05_uaos_set_project_v1"/"SARI_UAOS_PC_SET_V1.uaosproj", "uaosstyle": ROOT/"05_uaos_set_project_v1"/"SARI_ARABIC_POP_STYLE_V1.uaosstyle", "uaoslib": ROOT/"04_arabic_strings_library_v1"/"UAOS_ARABIC_STRINGS_LIBRARY_V1.uaoslib", "manifest": ROOT/"05_uaos_set_project_v1"/"UAOS_SET_MANIFEST.json"}
markers = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER"]
forbidden_claims = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED"]
forbidden_path_terms = ["owner-fixtures", "App.jsx", "deploy", "payment", "proprietary_samples_copied"]
result = {"status": "PASS", "checks": {}, "warnings": [], "failures": []}
for name, path in required.items():
    result["checks"][f"{name}_exists"] = path.exists()
    if not path.exists(): result["failures"].append(f"missing {name}: {path}")
text_files = [p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() not in {".mid", ".py"}]
combined = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in text_files)
for marker in markers:
    result["checks"][f"marker_{marker}"] = marker in combined
    if marker not in combined: result["failures"].append(f"missing marker {marker}")
for term in forbidden_claims:
    result["checks"][f"forbidden_claim_absent_{term}"] = term not in combined
    if term in combined: result["failures"].append(f"forbidden claim present: {term}")
for path in ROOT.rglob("*"):
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    for term in forbidden_path_terms:
        if term in rel:
            result["failures"].append(f"forbidden path term {term}: {rel}")
result["checks"]["midi_exists_or_skipped"] = (ROOT/"06_midi_export_preview"/"SARI_ARABIC_POP_STYLE_PREVIEW_V1.mid").exists() or (ROOT/"06_midi_export_preview"/"MIDI_SKIPPED_REPORT.md").exists()
if not result["checks"]["midi_exists_or_skipped"]: result["failures"].append("MIDI missing and no skipped report")
if result["failures"]: result["status"] = "FAIL"
(ROOT/"07_validator"/"VALIDATOR_RESULT.json").write_text(json.dumps(result, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
report=["# Validator Report", "", "PC_ONLY / UAOS_FORMAT / TEST_UNVERIFIED / NOT_FOR_PA3X_LOAD / NOT_FOR_USB_TRANSFER", "", f"Status: {result['status']}", ""]
report.extend(f"- {k}: {'PASS' if v else 'FAIL'}" for k,v in result["checks"].items())
if result["failures"]: report += ["", "Failures:"] + [f"- {x}" for x in result["failures"]]
(ROOT/"reports"/"VALIDATOR_REPORT.md").write_text("\n".join(report)+"\n", encoding="utf-8")
print(json.dumps(result, indent=2, ensure_ascii=False))
