
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[2]
V=Path(__file__).resolve().parents[1]
OUT=V/'generated'/'UAOS_V91_VALIDATOR_RESULTS.json'
def write(checks):
    passed=all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V91_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1

def main():
    idx=V/'daw-test/UAOS_V91_MIDI_FILE_INDEX.json'
    data=json.loads(idx.read_text(encoding='utf-8')) if idx.exists() else {}
    refs=data.get('midi_files',{})
    checks=[{'name':'index exists','passed':idx.exists(),'detail':str(idx)},{'name':'required references','passed':all(k in refs for k in ['v71_midi','v81_midi','v82_midi','v85_zip','v89_zip']),'detail':json.dumps(refs)},{'name':'start and steps exist','passed':(V/'daw-test/UAOS_V91_OWNER_DAW_TEST_START_HERE.md').exists() and (V/'daw-test/UAOS_V91_CUBASE_IMPORT_STEPS.md').exists(),'detail':'files'}]
    return write(checks)
if __name__=='__main__': raise SystemExit(main())
