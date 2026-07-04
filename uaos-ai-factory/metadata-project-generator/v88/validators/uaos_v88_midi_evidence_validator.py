
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[2]
V = Path(__file__).resolve().parents[1]
OUT = V / 'generated' / 'UAOS_V88_VALIDATOR_RESULTS.json'
def midi_ok(p: Path) -> bool: return p.exists() and p.read_bytes().startswith(b'MThd') and b'MTrk' in p.read_bytes()
def write(checks):
    passed = all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V88_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks}, indent=2)+'\n', encoding='utf-8')
    return 0 if passed else 1

def main():
    idx=V/'evidence/UAOS_V88_MIDI_TEST_EVIDENCE_INDEX.json'
    data=json.loads(idx.read_text(encoding='utf-8')) if idx.exists() else {}
    ev=data.get('evidence',{})
    checks=[{'name':'evidence index exists','passed':idx.exists(),'detail':str(idx)},{'name':'required evidence true','passed':all(ev.get(k) is True for k in ['v71_midi_exists','v81_midi_exists','v82_midi_exists','v74_hardened_validator_exists','v85_zip_exists','generic_only']),'detail':json.dumps(ev)}]
    return write(checks)
if __name__ == '__main__': raise SystemExit(main())
