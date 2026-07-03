#!/usr/bin/env python3
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
required = {
 "stable_folder": ROOT,
 "home_html": ROOT/"UAOS_PC_WORKSTATION_HOME.html",
 "cmd_launcher": ROOT/"START_UAOS_PC_WORKSTATION.cmd",
 "preview_player": ROOT/"preview"/"UAOS_PREVIEW_PLAYER_V6.html",
 "library_manager": ROOT/"library"/"UAOS_LIBRARY_MANAGER_V7.html",
 "arabic_strings_pack": ROOT/"library"/"arabic_strings"/"UAOS_ARABIC_STRINGS_PACK_V1.uaoslib",
 "project": ROOT/"project"/"SARI_UAOS_PC_WORKSTATION_PROJECT_V9"/"project.uaosproj",
 "writer": ROOT/"writer"/"uaos_pc_workstation_writer_v9.py",
 "midi": ROOT/"midi"/"SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid",
}
markers = ["PC_ONLY", "NOT_FOR_PA3X_LOAD", "NOT_FOR_USB_TRANSFER"]
forbidden = ["PA3X_READY", "KORG_COMPATIBLE", "LOAD_TO_PA3X", "USB_COPY_EXECUTED"]
forbidden_paths = ["App.jsx", "owner-fixtures", "deploy", "payment"]
res = {"status":"PASS", "checks":{}, "failures":[], "warnings":[]}
for k,p in required.items():
    ok = p.exists(); res["checks"][f"{k}_exists"] = ok
    if not ok: res["failures"].append(f"missing {k}: {p}")
text = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() not in {".mid", ".py"} and "VALIDATOR_RESULT" not in p.name)
for m in markers:
    ok = m in text; res["checks"][f"marker_{m}"] = ok
    if not ok: res["failures"].append(f"missing marker {m}")
for f in forbidden:
    ok = f not in text; res["checks"][f"forbidden_absent_{f}"] = ok
    if not ok: res["failures"].append(f"forbidden term present {f}")
for p in ROOT.rglob("*"):
    rel = str(p.relative_to(ROOT)).replace("\\", "/")
    for term in forbidden_paths:
        if term in rel: res["failures"].append(f"forbidden path term {term}: {rel}")
if res["failures"]: res["status"] = "FAIL"
(ROOT/"validator"/"VALIDATOR_RESULT.json").write_text(json.dumps(res, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
print(json.dumps(res, indent=2, ensure_ascii=False))
