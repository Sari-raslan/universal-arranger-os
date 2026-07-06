from pathlib import Path
import json
RUN = Path(__file__).resolve().parents[1]
RESULT = RUN / "v350_style_validator_stress" / "UAOS_V350_STYLE_VALIDATOR_STRESS_RESULTS.json"
REQ = ["intro_1","intro_2","variation_a","variation_b","variation_c","variation_d","fill_a","fill_b","break","ending_1","ending_2"]
FORB = (".sty",".set",".prs",".prf",".kst")
def midi_ok(p):
    b=p.read_bytes()
    return b.startswith(b"MThd") and b.find(b"MTrk") > 0
def main():
    styles=list(RUN.rglob("*.uaosstyle.json"))+list(RUN.rglob("*.style.json"))
    bad=[]
    for p in styles:
        d=json.loads(p.read_text(encoding="utf-8"))
        if not all(s in d.get("sections",{}) for s in REQ): bad.append(str(p))
    midis=list(RUN.rglob("*.mid"))
    bad_mid=[str(p) for p in midis if not midi_ok(p)]
    forb=[str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORB]
    terms=["KORG"+"-compatible","PA3X"+"-ready"]
    claims=[]
    for p in RUN.rglob("*"):
        if p in {Path(__file__).resolve(), RESULT}: continue
        if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt",".py"}:
            t=p.read_text(encoding="utf-8", errors="ignore")
            for term in terms:
                if term in t: claims.append(str(p.relative_to(RUN)))
    result={"style_files_parse": not bad, "required_sections_exist": not bad, "midi_files_valid": not bad_mid, "forbidden_extensions_absent": not forb, "no_false_claims": not claims, "style_count": len([p for p in styles if p.name.endswith(".uaosstyle.json")]), "midi_count": len(midis), "errors": bad+bad_mid+forb+claims}
    result["status"]="PASS" if all(v for k,v in result.items() if k not in {"errors","status","style_count","midi_count"}) else "FAIL"
    result["pass"]=result["status"]=="PASS"
    RESULT.write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))
    return 0 if result["pass"] else 1
if __name__=="__main__": raise SystemExit(main())
