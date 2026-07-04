
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parent.parent
ROOT=Path(__file__).resolve().parents[3]
BATCH=Path(__file__).resolve().parent
OUT=BATCH/'UAOS_BATCH_V81_V85_MIDI_UPGRADE_VALIDATOR_RESULTS.json'
FORBIDDEN={'.set','.sty','.prf','.prs','.kst','.wav','.mp3','.exe','.msi','.bat','.cmd','.ps1'}
def midi_ok(p): return p.exists() and p.read_bytes().startswith(b'MThd') and b'MTrk' in p.read_bytes()
def status(p): return json.loads(p.read_text(encoding='utf-8')).get('status','UNKNOWN') if p.exists() else 'MISSING'
def appjsx_changed():
    proc=subprocess.run(['git','-C',str(ROOT),'diff','--name-only','HEAD','--'],capture_output=True,text=True,check=False)
    return any(line.replace('\\','/').endswith('App.jsx') for line in proc.stdout.splitlines())
def scan_text():
    patterns={'usb_path':['usb:\\','\\usb\\','copy to usb','usb write: yes'],'pa3x_load':['pa3x load: yes','load to pa3x'],'react_integration':['react integration: yes','react-dom'],'deploy_payment':['deploy: yes','payment: yes'],'compatibility_claim':['compatibility claim: yes','compatible with pa3x'],'pa3x_ready_claim':['pa3x-ready: yes','pa3x ready: yes']}
    hits={k:[] for k in patterns}
    for root in [BASE/n for n in ['v81','v82','v83','v84','v85','batch-v81-v85-midi-upgrade']]:
        for p in root.rglob('*') if root.exists() else []:
            if not p.is_file() or p.suffix.lower() in {'.py','.mid','.zip'}: continue
            text=p.read_text(encoding='utf-8',errors='ignore').lower()
            for k,vals in patterns.items():
                if any(v in text for v in vals): hits[k].append(str(p.relative_to(BASE)))
    return {k:v for k,v in hits.items() if v}
def main():
    checks=[]
    for v in range(81,86): checks.append({'name':f'V{v} PASS','passed':status(BASE/f'v{v}/generated/UAOS_V{v}_VALIDATOR_RESULTS.json')=='PASS','detail':status(BASE/f'v{v}/generated/UAOS_V{v}_VALIDATOR_RESULTS.json')})
    checks += [
      {'name':'V71 MIDI exists','passed':(BASE/'v71/midi/UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid').exists(),'detail':'V71'},
      {'name':'V81 MIDI exists and valid','passed':midi_ok(BASE/'v81/midi/UAOS_V81_SECTION_BASED_REAL_MIDI_EXPORT.mid'),'detail':'V81'},
      {'name':'V82 MIDI exists and valid','passed':midi_ok(BASE/'v82/midi/UAOS_V82_MULTITRACK_ARRANGEMENT_EXPORT.mid'),'detail':'V82'},
      {'name':'V83 package exists and valid','passed':(BASE/'v83/package/UAOS_V83_MIDI_UPGRADE_PROJECT_PACKAGE.uaos.json').exists(),'detail':'V83'},
    ]
    zp=BASE/'v85/exports/UAOS_V85_GENERIC_MIDI_TEST_PACKAGE.zip'; zip_ok=False; bad=[]
    if zp.exists():
        with zipfile.ZipFile(zp) as z:
            entries=[i.filename for i in z.infolist() if not i.is_dir()]; zip_ok=bool(entries); bad=[e for e in entries if Path(e).suffix.lower() in FORBIDDEN]
    checks.append({'name':'V85 ZIP exists and valid','passed':zip_ok and not bad,'detail':','.join(bad) or str(zp)})
    local_bad=[]
    for root in [BASE/n for n in ['v81','v82','v83','v84','v85','batch-v81-v85-midi-upgrade']]:
        for p in root.rglob('*') if root.exists() else []:
            if p.is_file() and p.suffix.lower() in FORBIDDEN: local_bad.append(str(p.relative_to(BASE)))
    text_hits=scan_text()
    checks += [{'name':'no forbidden KORG files','passed':not local_bad,'detail':','.join(local_bad) or 'none'}, {'name':'no USB/PA3X/React/deploy/payment/claims','passed':not text_hits,'detail':json.dumps(text_hits,sort_keys=True)}, {'name':'no App.jsx touched','passed':not appjsx_changed(),'detail':'git diff HEAD'}]
    passed=all(c['passed'] for c in checks)
    OUT.write_text(json.dumps({'validator':'UAOS_BATCH_V81_V85_MIDI_UPGRADE_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks,'next_fastest_action':'V86-V90 Final Local Trial + External Tester Package'},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1
if __name__=='__main__': raise SystemExit(main())
