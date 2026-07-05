from pathlib import Path
import json, subprocess, sys
root=Path(r"E:\keyboard-manager-clean")
run=root/"uaos-ai-factory"/"rank1-deep-parser-refinement-v181-v190"
rank1=root/"uaos-ai-factory"/"fixture-rank1-readonly-scan-v161-v170"
prev=root/"uaos-ai-factory"/"parser-refinement-v171-v180"
results={"checks":{},"errors":[]}
def check(name, ok, detail=""):
    results["checks"][name]={"pass":bool(ok),"detail":detail}
    if not ok: results["errors"].append(f"{name}: {detail}")
def load(p): return json.loads(p.read_text(encoding="utf-8-sig"))
prior=[rank1/"02_hash_baseline"/"UAOS_RANK_1_HASH_BASELINE.json",rank1/"03_header_scan"/"UAOS_RANK_1_HEADER_SCAN.json",rank1/"04_unknown_chunk_scan"/"UAOS_RANK_1_UNKNOWN_CHUNK_SCAN.json",prev/"v176_safe_parser_schema_v2"/"UAOS_V176_READONLY_PARSER_SCHEMA_V2.json",prev/"v173_unknown_chunk_taxonomy"/"UAOS_V173_UNKNOWN_CHUNK_TAXONOMY.json"]
check("prior_rank1_scan_inputs_exist", all(p.exists() for p in prior[:3]), "rank1 inputs")
check("v171_v180_inputs_exist", all(p.exists() for p in prior[3:]), "v171-v180 inputs")
required=[
 ("evidence_consolidation",run/"v181_rank1_evidence_consolidation"/"UAOS_V181_RANK1_EVIDENCE_CONSOLIDATION.json"),
 ("header_model_v2",run/"v182_header_region_model_v2"/"UAOS_V182_HEADER_REGION_MODEL_V2.json"),
 ("unknown_region_index_v2",run/"v183_unknown_region_index_v2"/"UAOS_V183_UNKNOWN_REGION_INDEX_V2.json"),
 ("section_hypothesis_v2",run/"v184_section_pattern_hypothesis_v2"/"UAOS_V184_SECTION_PATTERN_HYPOTHESIS_V2.json"),
 ("track_program_hypothesis_v2",run/"v185_track_program_hypothesis_v2"/"UAOS_V185_TRACK_PROGRAM_HYPOTHESIS_V2.json"),
 ("parser_schema_v3",run/"v186_safe_parser_schema_v3"/"UAOS_V186_READONLY_PARSER_SCHEMA_V3.json"),
 ("confidence_matrix",run/"v188_rank1_research_confidence_matrix"/"UAOS_V188_RANK1_RESEARCH_CONFIDENCE_MATRIX.json")]
for name,p in required: check(name+"_exists", p.exists(), str(p))
text=""
for f in run.rglob("*"):
    if f.name == "uaos_rank1_deep_parser_refinement_v181_v190_validator.py" or f.name == "UAOS_RANK1_DEEP_PARSER_REFINEMENT_RULES.md": continue
    if f.is_file() and f.suffix.lower() in {".md",".json",".html",".txt",".py"}: text += f.read_text(encoding="utf-8", errors="ignore")+"\n"
check("no_rank2_scan_executed", "rank 2 scanned: yes" not in text.lower() and '"rank2_scanned": true' not in text.lower(), "Rank 2 not scanned")
writer_terms=["function writeKorg","class KorgWriter","writeKorgFile(","encodeKorgBinary("]
check("no_writer_implementation", not any(t in text for t in writer_terms), "no writer code")
unsafe=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".sty",".set",".prs",".prf",".kst"}]
check("no_generated_korg_output", not unsafe, ", ".join(unsafe))
check("no_sty_set_generated", not unsafe, ", ".join(unsafe))
check("no_prs_prf_kst_generated", not unsafe, ", ".join(unsafe))
check("no_usb", "usb write: yes" not in text.lower() and "usb_write\": true" not in text.lower(), "USB blocked")
check("no_pa3x_load", "pa3x load: yes" not in text.lower() and "pa3x_load\": true" not in text.lower(), "PA3X blocked")
check("no_deploy", "vercel deploy" not in text.lower() and "github pages deploy" not in text.lower(), "no deploy commands")
cp=subprocess.run(["git","diff","--name-only","--","uaos-live-clean/src/App.jsx"], cwd=str(root), text=True, capture_output=True)
check("no_appjsx_change", cp.stdout.strip()=="", cp.stdout.strip())
large=[str(p.relative_to(run)) for p in run.rglob("*") if p.is_file() and p.suffix.lower() in {".md",".json",".html",".txt"} and p.stat().st_size > 1048576]
check("no_full_fixture_copy", not large, ", ".join(large))
claim1="KORG-"+"compatible"; claim2="PA3X-"+"ready"
check("no_device_compatibility_claim", claim1 not in text, "claim absent")
check("no_pa3x_readiness_claim", claim2 not in text, "claim absent")
check("all_mappings_guarded", "mapping solved: yes" not in text.lower() and ("UNKNOWN/UNCONFIRMED" in text or "HYPOTHESIS" in text), "guarded")
matrix=load(run/"v188_rank1_research_confidence_matrix"/"UAOS_V188_RANK1_RESEARCH_CONFIDENCE_MATRIX.json") if (run/"v188_rank1_research_confidence_matrix"/"UAOS_V188_RANK1_RESEARCH_CONFIDENCE_MATRIX.json").exists() else {}
check("writer_ready_false", matrix.get("writer_ready") is False, str(matrix.get("writer_ready")))
results["status"]="PASS" if not results["errors"] else "FAIL"
results["pass"]=not results["errors"]
(run/"validators"/"UAOS_RANK1_DEEP_PARSER_REFINEMENT_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
(run/"batch-v181-v190-rank1-deep-parser-refinement"/"UAOS_BATCH_V181_V190_RANK1_DEEP_REFINEMENT_VALIDATOR_RESULTS.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
sys.exit(0 if results["pass"] else 1)
