
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[2]
V = Path(__file__).resolve().parents[1]
OUT = V / 'generated' / 'UAOS_V90_VALIDATOR_RESULTS.json'
def midi_ok(p: Path) -> bool: return p.exists() and p.read_bytes().startswith(b'MThd') and b'MTrk' in p.read_bytes()
def write(checks):
    passed = all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V90_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks}, indent=2)+'\n', encoding='utf-8')
    return 0 if passed else 1

def main():
    summary=V/'summary/UAOS_V90_FINAL_V71_TO_V90_TRIAL_SUMMARY.md'
    options=V/'summary/UAOS_V90_NEXT_OPTIONS_AFTER_LOCAL_TRIAL.md'
    text=options.read_text(encoding='utf-8') if options.exists() else ''
    required=['Improve MIDI musical quality further','Test current MIDI in Cubase/DAW and collect feedback','Prepare read-only KORG research pack','Prepare desktop wrapper spec only','Keep KORG writer blocked until explicit approval']
    return write([{'name':'summary exists','passed':summary.exists(),'detail':str(summary)},{'name':'next options separated','passed':all(x in text for x in required),'detail':'options'}])
if __name__ == '__main__': raise SystemExit(main())
