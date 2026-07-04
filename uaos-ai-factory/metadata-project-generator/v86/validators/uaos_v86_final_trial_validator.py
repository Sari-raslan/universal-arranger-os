
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[2]
V = Path(__file__).resolve().parents[1]
OUT = V / 'generated' / 'UAOS_V86_VALIDATOR_RESULTS.json'
def midi_ok(p: Path) -> bool: return p.exists() and p.read_bytes().startswith(b'MThd') and b'MTrk' in p.read_bytes()
def write(checks):
    passed = all(c['passed'] for c in checks)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'validator':'UAOS_V86_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks}, indent=2)+'\n', encoding='utf-8')
    return 0 if passed else 1

def main():
    html = V/'trial/UAOS_V86_FINAL_LOCAL_TRIAL_DASHBOARD.html'
    text = html.read_text(encoding='utf-8') if html.exists() else ''
    required = ['V71 MIDI','V81 Section MIDI','V82 Multitrack MIDI','V85 MIDI test ZIP','V77 Local Program RC Dashboard','V79 Owner Test Steps','V84 Cubase/DAW Test Steps','V75 Local Export Preview','MIDI exports available','YES','KORG export','BLOCKED','App.jsx','NOT TOUCHED']
    return write([{'name':'dashboard exists','passed':html.exists(),'detail':str(html)},{'name':'required links and statuses','passed':all(x in text for x in required),'detail':'dashboard text'}])
if __name__ == '__main__': raise SystemExit(main())
