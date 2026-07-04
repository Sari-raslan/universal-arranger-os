
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[2]
V = Path(__file__).resolve().parents[1]
OUT = V / 'generated' / 'UAOS_V84_VALIDATOR_RESULTS.json'

def midi_ok(path: Path) -> bool:
    return path.exists() and path.read_bytes().startswith(b'MThd') and b'MTrk' in path.read_bytes()

def write(status, checks):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V84_VALIDATOR','status':status,'generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks}, indent=2)+'\n', encoding='utf-8')
    return 0 if status == 'PASS' else 1

def main():
    files=['UAOS_V84_MIDI_TESTER_HANDOFF_README.md','UAOS_V84_CUBASE_TEST_STEPS.md','UAOS_V84_DAW_IMPORT_CHECKLIST.md','UAOS_V84_OWNER_FEEDBACK_FORM.md']
    checks=[{'name':f,'passed':(V/'tester'/f).exists(),'detail':str(V/'tester'/f)} for f in files]
    text=(V/'tester/UAOS_V84_CUBASE_TEST_STEPS.md').read_text(encoding='utf-8') if (V/'tester/UAOS_V84_CUBASE_TEST_STEPS.md').exists() else ''
    checks.append({'name':'test instructions present','passed':all(s in text for s in ['where MIDI files are','Import','listen','not KORG','feedback']) or all(s in text for s in ['Import','Listen','not KORG','Record']),'detail':'instructions'})
    return write('PASS' if all(c['passed'] for c in checks) else 'FAIL', checks)
if __name__ == '__main__': raise SystemExit(main())
