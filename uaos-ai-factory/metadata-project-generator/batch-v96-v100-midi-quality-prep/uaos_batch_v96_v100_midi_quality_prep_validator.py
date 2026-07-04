
from __future__ import annotations
import json, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parent.parent
ROOT=Path(__file__).resolve().parents[3]
BATCH=Path(__file__).resolve().parent
OUT=BATCH/'UAOS_BATCH_V96_V100_MIDI_QUALITY_PREP_VALIDATOR_RESULTS.json'
FORBIDDEN={'.set','.sty','.prf','.prs','.kst','.wav','.mp3','.mid','.zip','.exe','.msi','.bat','.cmd','.ps1'}
def status(p): return json.loads(p.read_text(encoding='utf-8')).get('status','UNKNOWN') if p.exists() else 'MISSING'
def appjsx_changed():
    proc=subprocess.run(['git','-C',str(ROOT),'diff','--name-only','HEAD','--'],capture_output=True,text=True,check=False)
    return any(line.replace('\\','/').endswith('App.jsx') for line in proc.stdout.splitlines())
def scan_text():
    patterns={'usb_path':['usb:\\','\\usb\\','copy to usb: yes','usb write: yes'],'pa3x_load':['pa3x load: yes','load to pa3x: yes'],'react_integration':['react integration: yes','react-dom'],'deploy_payment':['deploy: yes','payment: yes'],'compatibility_claim':['compatibility claim: yes','compatible with pa3x'],'pa3x_ready_claim':['pa3x-ready: yes','pa3x ready: yes']}
    hits={k:[] for k in patterns}
    for root in [BASE/n for n in ['v96','v97','v98','v99','v100','batch-v96-v100-midi-quality-prep']]:
        for p in root.rglob('*') if root.exists() else []:
            if not p.is_file() or p.suffix.lower()=='.py': continue
            text=p.read_text(encoding='utf-8',errors='ignore').lower()
            for k,vals in patterns.items():
                if any(v in text for v in vals): hits[k].append(str(p.relative_to(BASE)))
    return {k:v for k,v in hits.items() if v}
def main():
    checks=[]
    for v in range(96,101): checks.append({'name':f'V{v} PASS','passed':status(BASE/f'v{v}/generated/UAOS_V{v}_VALIDATOR_RESULTS.json')=='PASS','detail':status(BASE/f'v{v}/generated/UAOS_V{v}_VALIDATOR_RESULTS.json')})
    local_bad=[]
    for root in [BASE/n for n in ['v96','v97','v98','v99','v100','batch-v96-v100-midi-quality-prep']]:
        for p in root.rglob('*') if root.exists() else []:
            if p.is_file() and p.suffix.lower() in FORBIDDEN: local_bad.append(str(p.relative_to(BASE)))
    text_hits=scan_text()
    checks += [{'name':'no KORG files or generated MIDI/ZIP outputs','passed':not local_bad,'detail':','.join(local_bad) or 'none'}, {'name':'no USB/PA3X/React/deploy/payment/claims','passed':not text_hits,'detail':json.dumps(text_hits,sort_keys=True)}, {'name':'no App.jsx touched','passed':not appjsx_changed(),'detail':'git diff HEAD'}]
    passed=all(c['passed'] for c in checks)
    OUT.write_text(json.dumps({'validator':'UAOS_BATCH_V96_V100_MIDI_QUALITY_PREP_VALIDATOR','status':'PASS' if passed else 'FAIL','generated_at':datetime.now(timezone.utc).isoformat(),'checks':checks,'next_fastest_action':'V101-V105 Improved MIDI Generation Batch'},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1
if __name__=='__main__': raise SystemExit(main())
