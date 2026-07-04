
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[2]
V=Path(__file__).resolve().parents[1]
OUT=V/'generated'/'UAOS_V94_VALIDATOR_RESULTS.json'
def write(checks):
    passed=all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V94_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1

def main():
    t=V/'results/UAOS_V94_TESTER_RESULT_IMPORT_TEMPLATE.json'
    data=json.loads(t.read_text(encoding='utf-8')) if t.exists() else {}
    fields=data.get('fields',[])
    required=['tester','daw','test_date','v71_import_result','v81_import_result','v82_import_result','timing_notes','track_role_notes','section_notes','problems_found','improvement_requests']
    return write([{'name':'template exists','passed':t.exists(),'detail':str(t)},{'name':'required fields','passed':all(f in fields for f in required),'detail':json.dumps(fields)},{'name':'mapping exists','passed':(V/'results/UAOS_V94_FEEDBACK_TO_TASKS_MAPPING.md').exists(),'detail':'mapping'}])
if __name__=='__main__': raise SystemExit(main())
