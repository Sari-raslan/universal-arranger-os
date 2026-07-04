
from __future__ import annotations
import json, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[2]
V=Path(__file__).resolve().parents[1]
OUT=V/'generated'/'UAOS_V97_VALIDATOR_RESULTS.json'
def write(checks):
    passed=all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V97_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1

def main():
    p=V/'rules/UAOS_V97_MIDI_MUSICAL_RULE_MAP.json'
    data=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
    rules=data.get('generic_midi_rules',[])
    required=['stronger drum groove','bass follows root/fifth/walk-ups','chord voicing spread','pad long notes','melody guide not overcrowded','fill leads into chorus/ending','intro/verse/chorus/fill/ending markers']
    return write([{'name':'rule map exists','passed':p.exists(),'detail':str(p)},{'name':'required rules present','passed':all(r in rules for r in required),'detail':json.dumps(rules)}])
if __name__=='__main__': raise SystemExit(main())
