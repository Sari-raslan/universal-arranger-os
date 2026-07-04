
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[2]
V = Path(__file__).resolve().parents[1]
OUT = V / 'generated' / 'UAOS_V83_VALIDATOR_RESULTS.json'

def midi_ok(path: Path) -> bool:
    return path.exists() and path.read_bytes().startswith(b'MThd') and b'MTrk' in path.read_bytes()

def write(status, checks):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V83_VALIDATOR','status':status,'generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks}, indent=2)+'\n', encoding='utf-8')
    return 0 if status == 'PASS' else 1

def main():
    pkg = V/'package/UAOS_V83_MIDI_UPGRADE_PROJECT_PACKAGE.uaos.json'
    data = json.loads(pkg.read_text(encoding='utf-8')) if pkg.exists() else {}
    refs = data.get('references', {})
    checks=[{'name':'package exists','passed':pkg.exists(),'detail':str(pkg)}, {'name':'required references','passed':all(k in refs for k in ['v71_midi','v81_section_midi','v82_multitrack_midi','v75_preview','v77_rc_dashboard']),'detail':json.dumps(refs)}, {'name':'blocked states false','passed':not data.get('korg_output') and not data.get('usb_write') and not data.get('pa3x_load') and not data.get('appjsx_touched') and not data.get('deploy'),'detail':'blocked'}]
    return write('PASS' if all(c['passed'] for c in checks) else 'FAIL', checks)
if __name__ == '__main__': raise SystemExit(main())
