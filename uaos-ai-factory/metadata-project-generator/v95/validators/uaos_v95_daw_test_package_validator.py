
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[2]
V=Path(__file__).resolve().parents[1]
OUT=V/'generated'/'UAOS_V95_VALIDATOR_RESULTS.json'
def write(checks):
    passed=all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V95_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1

def main():
    zp=V/'exports/UAOS_V95_DAW_TEST_PACKAGE.zip'
    allowed={'.mid','.md','.json'}; forbidden={'.set','.sty','.prf','.prs','.kst','.wav','.mp3','.exe','.msi','.bat','.cmd','.ps1'}
    entries=[]; bad=[]
    if zp.exists():
        with zipfile.ZipFile(zp) as z:
            entries=[i.filename for i in z.infolist() if not i.is_dir()]
            bad=[e for e in entries if Path(e).suffix.lower() not in allowed or Path(e).suffix.lower() in forbidden]
    req=['V71_REAL_MIDI','V81_SECTION','V82_MULTITRACK','CUBASE_IMPORT','FEEDBACK_FORM','IMPROVEMENT_QUEUE','TESTER_RESULT_IMPORT_TEMPLATE','README','MANIFEST']
    return write([{'name':'zip exists and opens','passed':zp.exists() and bool(entries),'detail':str(zp)},{'name':'zip allowed contents only','passed':not bad,'detail':','.join(bad) or 'none'},{'name':'required contents','passed':all(any(r in e for e in entries) for r in req),'detail':','.join(entries)}])
if __name__=='__main__': raise SystemExit(main())
