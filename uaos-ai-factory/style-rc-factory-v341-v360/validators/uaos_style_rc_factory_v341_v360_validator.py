from pathlib import Path
import json, zipfile, subprocess, sys, re
RUN=Path(__file__).resolve().parents[1]
RESULT=RUN/"validators"/"UAOS_STYLE_RC_FACTORY_V341_V360_RESULTS.json"
ZIP=RUN/"v352_style_rc_package_zip"/"UAOS_V352_STYLE_RC_FACTORY_PACKAGE.zip"
FORB=(".sty",".set",".prs",".prf",".kst")
ALLOWED=(".uaosstyle.json",".style.json",".mid",".json",".md",".html",".txt")
def exists(rel): return {"pass":(RUN/rel).exists(),"detail":str(RUN/rel)}
def read_json(rel): return json.loads((RUN/rel).read_text(encoding="utf-8"))
def run_v350():
    proc=subprocess.run([sys.executable,str(RUN/"v350_style_validator_stress"/"uaos_v350_style_validator_stress.py")],cwd=str(RUN),text=True,capture_output=True)
    try: data=read_json("v350_style_validator_stress/UAOS_V350_STYLE_VALIDATOR_STRESS_RESULTS.json")
    except Exception: data={"pass":False,"stderr":proc.stderr}
    return {"pass":data.get("pass") is True,"detail":data}
def all_files():
    req=["v341_factory_scope/UAOS_V341_STYLE_RC_FACTORY_SCOPE.md","v342_style_templates/UAOS_V342_STYLE_TEMPLATE_INDEX.md","v349_style_compare_tool/UAOS_V349_STYLE_COMPARE_TOOL.html","v351_owner_style_selector/UAOS_V351_OWNER_STYLE_SELECTOR.html","v352_style_rc_package_zip/UAOS_V352_STYLE_RC_FACTORY_PACKAGE.zip","v353_style_metadata_index/UAOS_V353_STYLE_RC_FACTORY_INDEX.json","v354_daw_test_pack/UAOS_V354_STYLE_RC_DAW_TEST_STEPS.md","v355_sound_library_bindings/UAOS_V355_STYLE_RC_LIBRARY_BINDINGS.json","v356_react_status_card/UAOS_V356_REACT_STATUS_CARD_RESULT.json","v357_owner_review_gate/UAOS_V357_STYLE_RC_FACTORY_OWNER_REVIEW_GATE.md","v360_final_style_rc_factory_seal/UAOS_V360_STYLE_RC_FACTORY_FINAL_SEAL.md"]
    miss=[r for r in req if not (RUN/r).exists()]
    return {"pass":not miss,"detail":miss or "all V341-V360 files"}
def style_count(): return len(list(RUN.rglob("*.uaosstyle.json")))
def midi_valid():
    bad=[]
    for p in RUN.rglob("*.mid"):
        b=p.read_bytes()
        if not b.startswith(b"MThd") or b.find(b"MTrk")<0: bad.append(str(p.relative_to(RUN)))
    return {"pass":not bad,"detail":bad or "valid midi"}
def zip_allowed():
    bad=[]
    if not ZIP.exists(): return {"pass":False,"detail":"missing zip"}
    with zipfile.ZipFile(ZIP) as zf:
        for n in zf.namelist():
            l=n.lower()
            if not l.endswith(ALLOWED): bad.append(n)
            if l.endswith(FORB): bad.append(n)
            if "usb" in l and (l.endswith(".cmd") or l.endswith(".ps1")): bad.append(n)
            if "pa3x" in l and (l.endswith(".cmd") or l.endswith(".ps1")): bad.append(n)
    return {"pass":not bad,"detail":bad or "allowed"}
def no_forbidden_files():
    hits=[str(p.relative_to(RUN)) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORB]
    return {"pass":not hits,"detail":hits or "none"}
def no_false_claims():
    terms=["KORG"+"-compatible","PA3X"+"-ready"]
    hits=[]
    for p in RUN.rglob("*"):
        if p in {Path(__file__).resolve(),RESULT}: continue
        if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".py"}:
            t=p.read_text(encoding="utf-8",errors="ignore")
            for term in terms:
                if term in t: hits.append(str(p.relative_to(RUN)))
    return {"pass":not hits,"detail":hits or "absent"}
def no_unsafe_positive():
    pats=[r"Real writer implemented:\s*YES",r"Real keyboard output:\s*YES",r"USB write:\s*YES",r"PA3X load:\s*YES",r"Deploy:\s*YES",r"Payment activation:\s*YES"]
    hits=[]
    for p in RUN.rglob("*"):
        if p in {Path(__file__).resolve(),RESULT}: continue
        if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".py"}:
            t=p.read_text(encoding="utf-8",errors="ignore")
            for pat in pats:
                if re.search(pat,t,re.IGNORECASE): hits.append(str(p.relative_to(RUN)))
    return {"pass":not hits,"detail":hits or "no unsafe positive actions"}
def react_build():
    d=read_json("v356_react_status_card/UAOS_V356_REACT_STATUS_CARD_RESULT.json")
    if not d.get("react_touched"): return {"pass":True,"detail":"not touched"}
    return {"pass":d.get("build_pass") is True,"detail":d.get("build_pass")}
checks={"agent_integration_exists":exists("agent-outputs/UAOS_V341_V360_AGENT_INTEGRATION_MAP.json"),"v341_v360_files_exist":all_files(),"at_least_5_style_rcs":{"pass":style_count()>=5,"detail":style_count()},"midi_packs_valid":midi_valid(),"compare_tool_exists":exists("v349_style_compare_tool/UAOS_V349_STYLE_COMPARE_TOOL.html"),"owner_selector_exists":exists("v351_owner_style_selector/UAOS_V351_OWNER_STYLE_SELECTOR.html"),"zip_exists_allowed_only":zip_allowed(),"v350_validator_pass":run_v350(),"react_build_pass_if_touched":react_build(),"no_real_writer_implementation":no_unsafe_positive(),"no_generated_korg_output":no_forbidden_files(),"no_sty_set_generated":no_forbidden_files(),"no_prs_prf_kst_generated":no_forbidden_files(),"no_usb_pa3x_deploy_payment_positive_action":no_unsafe_positive(),"no_exact_false_claims":no_false_claims()}
errs=[k for k,v in checks.items() if not v["pass"]]
res={"checks":checks,"errors":errs,"status":"PASS" if not errs else "FAIL","pass":not errs}
RESULT.write_text(json.dumps(res,indent=2),encoding="utf-8")
print(json.dumps(res,indent=2))
raise SystemExit(0 if not errs else 1)
