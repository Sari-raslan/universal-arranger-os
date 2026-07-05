
from __future__ import annotations
import json, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE=Path(__file__).resolve().parents[1]
ROOT=Path(__file__).resolve().parents[2]
OUT=BASE/'validators/UAOS_SOUND_LIBRARY_PRIORITY_REFINEMENT_RESULTS.json'
FORBIDDEN={'.set','.sty','.prf','.prs','.kst','.wav','.mp3','.mid','.zip','.exe','.msi','.bat','.cmd','.ps1'}
PATTERNS={'commercial_paths':['program files\\native instruments','native instruments\\','kontakt libraries\\','/kontakt/','/native instruments/','paid library path:'],'proprietary_extraction':['proprietary_source_used": true','proprietary extraction: yes','commercial library copy: yes'],'usb_path':['usb:\\','\\usb\\','copy to usb: yes','usb write: yes'],'pa3x_load':['pa3x load: yes','load to pa3x: yes'],'react_integration':['react integration: yes','react-dom'],'deploy_payment':['deploy: yes','payment: yes'],'compatibility_claim':['compatibility claim: yes','compatible with pa3x','compatibility_claim": true'],'pa3x_ready_claim':['pa3x-ready: yes','pa3x ready: yes','pa3x_ready": true']}
def appjsx_changed():
    proc=subprocess.run(['git','-C',str(ROOT),'diff','--name-only','HEAD','--'],capture_output=True,text=True,check=False)
    return any(line.replace('\\','/').endswith('App.jsx') for line in proc.stdout.splitlines())
def add(checks,name,passed,detail): checks.append({'name':name,'passed':bool(passed),'detail':detail})
def main():
    checks=[]
    refined=list((BASE/'priority-packs').glob('*.json'))
    presets=list((BASE/'expanded-presets/items').glob('*.json'))
    role_files=[BASE/'midi-role-maps/UAOS_PRIORITY_PACK_MIDI_ROLE_MAP.json',BASE/'midi-role-maps/UAOS_ORIENTAL_DRUMS_MIDI_ROLE_MAP.md',BASE/'midi-role-maps/UAOS_DABKE_PERCUSSION_MIDI_ROLE_MAP.md',BASE/'midi-role-maps/UAOS_ARABIC_STRINGS_MIDI_ROLE_MAP.md',BASE/'midi-role-maps/UAOS_OUD_QANUN_NAY_MIDI_ROLE_MAP.md',BASE/'midi-role-maps/UAOS_FULL_STYLE_STARTER_MIDI_ROLE_MAP.md']
    style_files=[BASE/'style-links/UAOS_PRIORITY_PACK_TO_STYLE_SECTION_MAP.json',BASE/'style-links/UAOS_PRIORITY_PACK_TO_V81_V82_MIDI_LINKS.md',BASE/'style-links/UAOS_PRIORITY_PACK_DAW_TEST_USAGE.md']
    review_files=[BASE/'review/UAOS_PRIORITY_PACK_OWNER_REVIEW_FORM.md',BASE/'review/UAOS_PRIORITY_PACK_OWNER_REVIEW_FORM.json',BASE/'review/UAOS_PRIORITY_PACK_SELECTION_GUIDE_AR.md',BASE/'review/UAOS_PRIORITY_PACK_SELECTION_GUIDE_EN.md',BASE/'review/UAOS_PRIORITY_PACK_NEXT_REFINEMENT_QUEUE.md']
    add(checks,'5 refined packs exist',len(refined)==5,str(len(refined)))
    add(checks,'at least 150 expanded presets exist',len(presets)>=150,str(len(presets)))
    add(checks,'MIDI role maps exist',all(p.exists() for p in role_files),','.join(str(p) for p in role_files))
    add(checks,'style links exist',all(p.exists() for p in style_files),','.join(str(p) for p in style_files))
    add(checks,'review pack exists',all(p.exists() for p in review_files),','.join(str(p) for p in review_files))
    bad_files=[]; hits={k:[] for k in PATTERNS}
    for p in BASE.rglob('*'):
        if not p.is_file(): continue
        if p == OUT: continue
        if p.suffix.lower() in FORBIDDEN: bad_files.append(str(p.relative_to(BASE)))
        if p.suffix.lower() in {'.json','.md','.html','.txt'}:
            text=p.read_text(encoding='utf-8',errors='ignore').lower()
            for key,vals in PATTERNS.items():
                if any(v in text for v in vals): hits[key].append(str(p.relative_to(BASE)))
    hits={k:v for k,v in hits.items() if v}
    add(checks,'no KORG/audio/device files',not bad_files,','.join(bad_files) or 'none')
    add(checks,'no commercial/proprietary/Kontakt/NI/USB/PA3X/App/claim text',not hits,json.dumps(hits,sort_keys=True))
    add(checks,'no App.jsx touched',not appjsx_changed(),'git diff HEAD')
    passed=all(c['passed'] for c in checks)
    OUT.write_text(json.dumps({'validator':'UAOS_SOUND_LIBRARY_PRIORITY_REFINEMENT_VALIDATOR','validator_result':'PASS' if passed else 'FAIL','checked_at':datetime.now(timezone.utc).isoformat(),'refined_pack_count':len(refined),'expanded_preset_count':len(presets),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1
if __name__=='__main__': raise SystemExit(main())
