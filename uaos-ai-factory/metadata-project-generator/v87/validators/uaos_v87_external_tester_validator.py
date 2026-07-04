
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[2]
V = Path(__file__).resolve().parents[1]
OUT = V / 'generated' / 'UAOS_V87_VALIDATOR_RESULTS.json'
def midi_ok(p: Path) -> bool: return p.exists() and p.read_bytes().startswith(b'MThd') and b'MTrk' in p.read_bytes()
def write(checks):
    passed = all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V87_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks}, indent=2)+'\n', encoding='utf-8')
    return 0 if passed else 1

def main():
    files=['UAOS_V87_EXTERNAL_TESTER_START_HERE.md','UAOS_V87_EXTERNAL_TESTER_README.md','UAOS_V87_TESTER_SCOPE.md','UAOS_V87_TESTER_DO_NOT_DO.md','UAOS_V87_TESTER_FEEDBACK_FORM.md','UAOS_V87_TESTER_FILE_INDEX.json']
    checks=[{'name':f,'passed':(V/'external-tester'/f).exists(),'detail':f} for f in files]
    text=(V/'external-tester/UAOS_V87_TESTER_DO_NOT_DO.md').read_text(encoding='utf-8') if (V/'external-tester/UAOS_V87_TESTER_DO_NOT_DO.md').exists() else ''
    checks.append({'name':'tester forbidden instructions present','passed':all(x in text for x in ['do not load on PA3X','do not copy to USB for keyboard','do not treat as KORG style','do not claim PA3X-ready','do not deploy']),'detail':'do not do'})
    return write(checks)
if __name__ == '__main__': raise SystemExit(main())
