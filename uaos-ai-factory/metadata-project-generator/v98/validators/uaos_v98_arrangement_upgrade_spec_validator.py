
from __future__ import annotations
import json, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[2]
V=Path(__file__).resolve().parents[1]
OUT=V/'generated'/'UAOS_V98_VALIDATOR_RESULTS.json'
def write(checks):
    passed=all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V98_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1

def main():
    p=V/'upgrade-spec/UAOS_V98_NEXT_MIDI_GENERATION_PARAMETERS.json'
    data=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
    params=data.get('generation_parameters',{})
    return write([{'name':'generation parameters exist','passed':p.exists(),'detail':str(p)},{'name':'required parameter groups','passed':all(k in params for k in ['drum_density','bass_motion','chord_voicing','pad_style','melody_density','fills','section_markers']),'detail':json.dumps(params)}])
if __name__=='__main__': raise SystemExit(main())
