#!/usr/bin/env python3
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
required = {
  "html": ROOT/"01_app"/"UAOS_PC_WORKSTATION_MVP_V2.html",
  "project_overview": ROOT/"02_viewer_data"/"PROJECT_OVERVIEW.json",
  "style_overview": ROOT/"02_viewer_data"/"STYLE_OVERVIEW.json",
  "library_overview": ROOT/"02_viewer_data"/"LIBRARY_OVERVIEW.json",
  "safety_overview": ROOT/"02_viewer_data"/"SAFETY_OVERVIEW.json",
  "writer_project": ROOT/"03_writer_engine_v2"/"generated_outputs"/"SARI_UAOS_PC_SET_V2.uaosproj",
  "writer_style": ROOT/"03_writer_engine_v2"/"generated_outputs"/"SARI_ARABIC_POP_STYLE_V2.uaosstyle",
  "writer_bindings": ROOT/"03_writer_engine_v2"/"generated_outputs"/"SARI_LIBRARY_BINDINGS_V2.json",
  "writer_manifest": ROOT/"03_writer_engine_v2"/"generated_outputs"/"UAOS_SET_V2_MANIFEST.json",
  "library_viewer": ROOT/"04_library_viewer"/"LIBRARY_VIEWER_DATA.json",
  "style_viewer": ROOT/"05_style_viewer"/"STYLE_VIEWER_DATA.json",
}
markers = ["PC_ONLY", "UAOS_FORMAT", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER", "NOT_COMPATIBILITY_VERIFIED"]
forbidden_claims = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED"]
forbidden_path_terms = ["App.jsx", "owner-fixtures", "deploy", "payment"]
result = {"status":"PASS", "checks":{}, "warnings":[], "failures":[]}
for name,path in required.items():
    ok = path.exists(); result["checks"][f"{name}_exists"] = ok
    if not ok: result["failures"].append(f"missing {name}: {path}")
midi = ROOT/"06_midi_preview"/"SARI_ARABIC_POP_STYLE_PREVIEW_V2.mid"
skip = ROOT/"06_midi_preview"/"MIDI_PREVIEW_SKIPPED.md"
result["checks"]["midi_exists_or_skipped"] = midi.exists() or skip.exists()
if not result["checks"]["midi_exists_or_skipped"]: result["failures"].append("MIDI preview missing and no skipped report")
text_files=[p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() not in {".mid", ".py"}]
combined="\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in text_files)
for marker in markers:
    ok = marker in combined; result["checks"][f"marker_{marker}"] = ok
    if not ok: result["failures"].append(f"missing safety label {marker}")
for term in forbidden_claims:
    ok = term not in combined; result["checks"][f"forbidden_absent_{term}"] = ok
    if not ok: result["failures"].append(f"forbidden claim present: {term}")
for path in ROOT.rglob("*"):
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    for term in forbidden_path_terms:
        if term in rel: result["failures"].append(f"forbidden path term {term}: {rel}")
if "PROPRIETARY_SAMPLE_PATH" in combined:
    result["failures"].append("proprietary sample path marker present")
if result["failures"]: result["status"]="FAIL"
(ROOT/"07_validator"/"VALIDATOR_RESULT.json").write_text(json.dumps(result, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
report=["# V2 Validator Report", "", "PC_ONLY / UAOS_FORMAT / TEST_UNVERIFIED / NOT_FOR_PA3X_LOAD / NOT_FOR_USB_TRANSFER / NOT_COMPATIBILITY_VERIFIED", "", f"Status: {result['status']}", ""]
report += [f"- {k}: {'PASS' if v else 'FAIL'}" for k,v in result["checks"].items()]
if result["failures"]: report += ["", "Failures:"] + [f"- {x}" for x in result["failures"]]
(ROOT/"reports"/"V2_VALIDATOR_REPORT.md").write_text("\n".join(report)+"\n", encoding="utf-8")
print(json.dumps(result, indent=2, ensure_ascii=False))
