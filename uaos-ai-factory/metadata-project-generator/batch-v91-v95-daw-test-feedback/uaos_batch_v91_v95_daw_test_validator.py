
from __future__ import annotations
import json, zipfile, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parent.parent
ROOT=Path(__file__).resolve().parents[3]
BATCH=Path(__file__).resolve().parent
OUT=BATCH/'UAOS_BATCH_V91_V95_DAW_TEST_VALIDATOR_RESULTS.json'
FORBIDDEN={'.set','.sty','.prf','.prs','.kst','.wav','.mp3','.exe','.msi','.bat','.cmd','.ps1'}
def status(p): return json.loads(p.read_text(encoding='utf-8')).get('status','UNKNOWN') if p.exists() else 'MISSING'
def appjsx_changed():
    proc=subprocess.run(['git','-C',str(ROOT),'diff','--name-only','HEAD','--'],capture_output=True,text=True,check=False)
    return any(line.replace('\\','/').endswith('App.jsx') for line in proc.stdout.splitlines())
def scan_text():
    patterns={'usb_path':['usb:\\','\\usb\\','copy to usb: yes','usb write: yes'],'pa3x_load':['pa3x load: yes','load to pa3x: yes'],'react_integration':['react integration: yes','react-dom'],'deploy_payment':['deploy: yes','payment: yes'],'compatibility_claim':['compatibility claim: yes','compatible with pa3x'],'pa3x_ready_claim':['pa3x-ready: yes','pa3x ready: yes']}
    hits={k:[] for k in patterns}
    for root in [BASE/n for n in ['v91','v92','v93','v94','v95','batch-v91-v95-daw-test-feedback']]:
        for p in root.rglob('*') if root.exists() else []:
            if not p.is_file() or p.suffix.lower() in {'.py','.mid','.zip'}: continue
            text=p.read_text(encoding='utf-8',errors='ignore').lower()
            for k,vals in patterns.items():
                if any(v in text for v in vals): hits[k].append(str(p.relative_to(BASE)))
    return {k:v for k,v in hits.items() if v}
def main():
    checks=[]
    for v in range(91,96): checks.append({'name':f'V{v} PASS','passed':status(BASE/f'v{v}/generated/UAOS_V{v}_VALIDATOR_RESULTS.json')=='PASS','detail':status(BASE/f'v{v}/generated/UAOS_V{v}_VALIDATOR_RESULTS.json')})
    midi_files=[BASE/'v71/midi/UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid',BASE/'v81/midi/UAOS_V81_SECTION_BASED_REAL_MIDI_EXPORT.mid',BASE/'v82/midi/UAOS_V82_MULTITRACK_ARRANGEMENT_EXPORT.mid']
    checks.append({'name':'MIDI files exist','passed':all(p.exists() for p in midi_files),'detail':','.join(str(p) for p in midi_files)})
    zp=BASE/'v95/exports/UAOS_V95_DAW_TEST_PACKAGE.zip'; entries=[]; bad=[]
    if zp.exists():
        with zipfile.ZipFile(zp) as z:
            entries=[i.filename for i in z.infolist() if not i.is_dir()]
            bad=[e for e in entries if Path(e).suffix.lower() in FORBIDDEN]
    checks.append({'name':'test package ZIP exists and valid','passed':zp.exists() and bool(entries) and not bad,'detail':','.join(bad) or str(zp)})
    local_bad=[]
    for root in [BASE/n for n in ['v91','v92','v93','v94','v95','batch-v91-v95-daw-test-feedback']]:
        for p in root.rglob('*') if root.exists() else []:
            if p.is_file() and p.suffix.lower() in FORBIDDEN: local_bad.append(str(p.relative_to(BASE)))
    text_hits=scan_text()
    checks += [{'name':'no forbidden KORG files','passed':not local_bad,'detail':','.join(local_bad) or 'none'}, {'name':'no USB/PA3X/React/deploy/payment/claims','passed':not text_hits,'detail':json.dumps(text_hits,sort_keys=True)}, {'name':'no App.jsx touched','passed':not appjsx_changed(),'detail':'git diff HEAD'}]
    passed=all(c['passed'] for c in checks)
    OUT.write_text(json.dumps({'validator':'UAOS_BATCH_V91_V95_DAW_TEST_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks,'next_fastest_action':'owner imports MIDI into Cubase and fills feedback form'},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1
if __name__=='__main__': raise SystemExit(main())
