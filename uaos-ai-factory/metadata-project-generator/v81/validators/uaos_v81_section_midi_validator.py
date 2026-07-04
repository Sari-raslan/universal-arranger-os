
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[2]
V = Path(__file__).resolve().parents[1]
OUT = V / 'generated' / 'UAOS_V81_VALIDATOR_RESULTS.json'

def midi_ok(path: Path) -> bool:
    return path.exists() and path.read_bytes().startswith(b'MThd') and b'MTrk' in path.read_bytes()

def write(status, checks):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V81_VALIDATOR','status':status,'generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks}, indent=2)+'\n', encoding='utf-8')
    return 0 if status == 'PASS' else 1

def main():
    midi = V/'midi/UAOS_V81_SECTION_BASED_REAL_MIDI_EXPORT.mid'
    section_map = V/'generated/UAOS_V81_SECTION_MAP.json'
    data = section_map.read_text(encoding='utf-8') if section_map.exists() else ''
    checks=[{'name':'V81 MIDI valid','passed':midi_ok(midi),'detail':str(midi)}, {'name':'generic sections present','passed':all(s in data for s in ['intro','verse','chorus','fill','ending']),'detail':str(section_map)}]
    return write('PASS' if all(c['passed'] for c in checks) else 'FAIL', checks)
if __name__ == '__main__': raise SystemExit(main())
