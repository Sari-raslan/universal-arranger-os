
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[2]
V = Path(__file__).resolve().parents[1]
OUT = V / 'generated' / 'UAOS_V85_VALIDATOR_RESULTS.json'

def midi_ok(path: Path) -> bool:
    return path.exists() and path.read_bytes().startswith(b'MThd') and b'MTrk' in path.read_bytes()

def write(status, checks):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V85_VALIDATOR','status':status,'generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks}, indent=2)+'\n', encoding='utf-8')
    return 0 if status == 'PASS' else 1

def main():
    zp = V/'exports/UAOS_V85_GENERIC_MIDI_TEST_PACKAGE.zip'
    allowed={'.mid','.json','.md'}; forbidden={'.set','.sty','.prf','.prs','.kst','.wav','.mp3','.exe','.msi','.bat','.cmd','.ps1'}
    ok=False; bad=[]
    if zp.exists():
        with zipfile.ZipFile(zp) as z:
            entries=[i.filename for i in z.infolist() if not i.is_dir()]
            ok=len(entries)>0
            bad=[e for e in entries if Path(e).suffix.lower() not in allowed or Path(e).suffix.lower() in forbidden]
    checks=[{'name':'ZIP exists and opens','passed':zp.exists() and ok,'detail':str(zp)}, {'name':'ZIP allowed contents only','passed':not bad,'detail':','.join(bad) or 'none'}]
    return write('PASS' if all(c['passed'] for c in checks) else 'FAIL', checks)
if __name__ == '__main__': raise SystemExit(main())
