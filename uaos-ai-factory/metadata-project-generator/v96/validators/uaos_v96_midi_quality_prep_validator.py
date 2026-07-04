
from __future__ import annotations
import json, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[2]
V=Path(__file__).resolve().parents[1]
OUT=V/'generated'/'UAOS_V96_VALIDATOR_RESULTS.json'
def write(checks):
    passed=all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V96_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1

def main():
    p=V/'diagnosis/UAOS_V96_MIDI_QUALITY_DIAGNOSIS_PREP.json'
    data=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
    checks=[{'name':'diagnosis prep exists','passed':p.exists(),'detail':str(p)},{'name':'generic planning only','passed':data.get('generic_midi_planning_only') is True and data.get('korg_output') is False and data.get('usb_write') is False and data.get('pa3x_load') is False,'detail':json.dumps(data)}]
    return write(checks)
if __name__=='__main__': raise SystemExit(main())
