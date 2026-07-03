import json, pathlib
root = pathlib.Path(__file__).resolve().parents[1]
candidate = root / "04_v7_candidate_local_only" / "UAOS_TEST_UNVERIFIED_MINIMAL_007_V7.PRF"
result = {"status":"WARN", "scope":"LOCAL_ONLY_NOT_COMPATIBILITY", "candidate_exists": candidate.exists(), "meaning":"No V7 candidate was created; validation skipped. WARN is not compatibility."}
pathlib.Path(__file__).with_name("PARSER_V4_VALIDATOR_RESULTS.json").write_text(json.dumps(result, indent=2), encoding="ascii")
print(json.dumps(result, indent=2))
