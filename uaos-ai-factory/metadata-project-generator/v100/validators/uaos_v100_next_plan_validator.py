
from __future__ import annotations
import json, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[2]
V=Path(__file__).resolve().parents[1]
OUT=V/'generated'/'UAOS_V100_VALIDATOR_RESULTS.json'
def write(checks):
    passed=all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V100_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1

def main():
    p=V/'plan/UAOS_V100_NEXT_MIDI_UPGRADE_EXECUTION_PLAN.json'
    data=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
    proposed=data.get('proposed_v101_v105',[])
    required=['V101 improved drums MIDI','V102 improved bass/chords MIDI','V103 improved section transitions/fills','V104 upgraded full arrangement MIDI package','V105 upgraded DAW test ZIP']
    return write([{'name':'next plan exists','passed':p.exists(),'detail':str(p)},{'name':'V101-V105 plan present','passed':all(r in proposed for r in required),'detail':json.dumps(proposed)}])
if __name__=='__main__': raise SystemExit(main())
