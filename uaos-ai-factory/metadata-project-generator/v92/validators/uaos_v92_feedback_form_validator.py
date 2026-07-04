
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[2]
V=Path(__file__).resolve().parents[1]
OUT=V/'generated'/'UAOS_V92_VALIDATOR_RESULTS.json'
def write(checks):
    passed=all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V92_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1

def main():
    form=V/'feedback/UAOS_V92_MIDI_LISTENING_FEEDBACK_FORM.json'
    data=json.loads(form.read_text(encoding='utf-8')) if form.exists() else {}
    cats=data.get('categories',[])
    required=['drums quality','bass quality','chords quality','pad quality','melody guide quality','section flow','intro/verse/chorus/fill/ending clarity','tempo feel','arrangement realism','DAW import issues','requested improvement']
    return write([{'name':'feedback json exists','passed':form.exists(),'detail':str(form)},{'name':'required categories','passed':all(c in cats for c in required),'detail':json.dumps(cats)}])
if __name__=='__main__': raise SystemExit(main())
