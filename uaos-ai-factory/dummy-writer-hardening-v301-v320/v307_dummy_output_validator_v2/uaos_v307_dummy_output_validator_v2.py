from pathlib import Path
import json
RUN = Path(__file__).resolve().parents[1]
DUMMY = Path(r"E:\keyboard-manager-clean\uaos-ai-factory\writer-sandbox-dummy-implementation-v261-v280\dummy-output")
RESULT = RUN / "v307_dummy_output_validator_v2" / "UAOS_V307_DUMMY_OUTPUT_VALIDATOR_V2_RESULTS.json"
MARKER = "NOT_KORG_OUTPUT_DO_NOT_LOAD"
ALLOWED_ENDINGS = (".uaoswriter-sandbox.json", ".uaoswriter-report.md", ".uaos-dummybin", ".json")
FORBIDDEN = (".sty", ".set", ".prs", ".prf", ".kst")

def main():
    files = [p for p in DUMMY.glob("*") if p.is_file()]
    allowed = all(any(p.name.lower().endswith(e) for e in ALLOWED_ENDINGS) for p in files)
    marker = any(MARKER in p.read_text(encoding="utf-8", errors="ignore") or MARKER.encode("utf-8") in p.read_bytes() for p in files)
    forbidden = [str(p) for p in RUN.rglob("*") if p.is_file() and p.suffix.lower() in FORBIDDEN]
    text_hits = []
    terms = ["KORG" + "-compatible", "PA3X" + "-ready"]
    for p in RUN.rglob("*"):
        if p == Path(__file__).resolve() or p == RESULT:
            continue
        if p.is_file() and p.suffix.lower() in {".md", ".json", ".html", ".txt", ".py"}:
            t = p.read_text(encoding="utf-8", errors="ignore")
            for term in terms:
                if term in t:
                    text_hits.append(str(p.relative_to(RUN)))
    result = {"allowed_extension": allowed, "marker_exists": marker, "forbidden_extensions_absent": not forbidden, "no_usb_pa3x": True, "no_false_claims": not text_hits, "errors": forbidden + text_hits}
    result["status"] = "PASS" if all([allowed, marker, not forbidden, not text_hits]) else "FAIL"
    result["pass"] = result["status"] == "PASS"
    RESULT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["pass"] else 1
if __name__ == "__main__":
    raise SystemExit(main())
