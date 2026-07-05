
from __future__ import annotations
import json, subprocess
from pathlib import Path
from datetime import datetime, timezone
BASE = Path(__file__).resolve().parents[1]
ROOT = Path(__file__).resolve().parents[2]
OUT = BASE / 'validators' / 'UAOS_SOUND_LIBRARY_FACTORY_VALIDATOR_RESULTS.json'
FORBIDDEN_EXT = {'.set','.sty','.prf','.prs','.kst'}
TEXT_PATTERNS = {
    'commercial_library_path': ['native instruments\\', 'kontakt libraries\\', 'program files\\native instruments', '/kontakt/', '/native instruments/', 'paid library path:'],
    'proprietary_extraction_claim': ['proprietary_source_used": true', 'proprietary sample extraction: yes', 'commercial_library_copy": true'],
    'usb_path': ['usb:\\', '\\usb\\', 'copy to usb: yes', 'usb write: yes'],
    'pa3x_load': ['pa3x load: yes', 'load to pa3x: yes'],
    'react_integration': ['react integration: yes', 'react-dom'],
    'deploy_payment': ['deploy: yes', 'payment: yes'],
    'compatibility_claim': ['compatibility claim: yes', 'compatible with pa3x'],
    'pa3x_ready_claim': ['pa3x-ready: yes', 'pa3x ready: yes', 'pa3x_ready": true']
}
def appjsx_changed() -> bool:
    proc = subprocess.run(['git','-C',str(ROOT),'diff','--name-only','HEAD','--'], capture_output=True, text=True, check=False)
    return any(line.replace('\\','/').endswith('App.jsx') for line in proc.stdout.splitlines())
def add(checks, name, passed, detail): checks.append({'name':name,'passed':bool(passed),'detail':detail})
def main():
    checks=[]
    catalog = BASE/'catalog/UAOS_SOUND_LIBRARY_MASTER_CATALOG.json'
    packs = list((BASE/'packs').glob('*.json'))
    presets = list((BASE/'presets/items').glob('*.json'))
    schemas = [BASE/'schemas/UAOS_SOUND_LIBRARY_PACK_SCHEMA.json', BASE/'schemas/UAOS_PRESET_SCHEMA.json', BASE/'schemas/UAOS_INSTRUMENT_ROLE_SCHEMA.json', BASE/'schemas/UAOS_STYLE_LIBRARY_SCHEMA.json', BASE/'schemas/UAOS_SAMPLE_PLACEHOLDER_SCHEMA.json']
    manifests = [BASE/'manifests/UAOS_SOUND_LIBRARY_FACTORY_MANIFEST.json', BASE/'manifests/UAOS_SOUND_LIBRARY_FACTORY_OUTPUT_INDEX.json', BASE/'manifests/UAOS_SOUND_LIBRARY_FACTORY_FILE_REGISTRY.json']
    add(checks,'catalog exists',catalog.exists(),str(catalog))
    add(checks,'at least 20 pack drafts exist',len(packs)>=20,str(len(packs)))
    add(checks,'at least 100 preset metadata files exist',len(presets)>=100,str(len(presets)))
    add(checks,'schemas exist',all(p.exists() for p in schemas),','.join(str(p) for p in schemas))
    add(checks,'manifests exist',all(p.exists() for p in manifests),','.join(str(p) for p in manifests))
    forbidden_files=[]; huge_files=[]; wav_bad=[]; text_hits={k:[] for k in TEXT_PATTERNS}
    for p in BASE.rglob('*'):
        if not p.is_file(): continue
        if p == OUT: continue
        suffix=p.suffix.lower()
        if suffix in FORBIDDEN_EXT: forbidden_files.append(str(p.relative_to(BASE)))
        if p.stat().st_size > 1_000_000: huge_files.append(f'{p.relative_to(BASE)}:{p.stat().st_size}')
        if suffix == '.wav':
            b=p.read_bytes()[:4096]
            if p.stat().st_size > 200_000 or b'SYNTHETIC_TEST_AUDIO_NOT_LIBRARY_SAMPLE' not in b:
                wav_bad.append(str(p.relative_to(BASE)))
        if suffix in {'.json','.md','.html','.txt'}:
            text=p.read_text(encoding='utf-8',errors='ignore').lower()
            for key, vals in TEXT_PATTERNS.items():
                if any(v in text for v in vals): text_hits[key].append(str(p.relative_to(BASE)))
    text_hits={k:v for k,v in text_hits.items() if v}
    add(checks,'no .SET/.STY/.PRF/.PRS/.KST',not forbidden_files,','.join(forbidden_files) or 'none')
    add(checks,'no commercial/proprietary/Kontakt/NI paths or unsafe claims',not text_hits,json.dumps(text_hits,sort_keys=True))
    add(checks,'no App.jsx touched',not appjsx_changed(),'git diff HEAD')
    add(checks,'no huge binary junk files',not huge_files,','.join(huge_files) or 'none')
    add(checks,'optional synthetic WAV files tiny and labeled if created',not wav_bad,','.join(wav_bad) or 'none')
    passed=all(c['passed'] for c in checks)
    OUT.write_text(json.dumps({'validator':'UAOS_SOUND_LIBRARY_FACTORY_NIGHT_VALIDATOR','validator_result':'PASS' if passed else 'FAIL','checked_at':datetime.now(timezone.utc).isoformat(),'pack_count':len(packs),'preset_count':len(presets),'checks':checks},indent=2)+'\n',encoding='utf-8')
    return 0 if passed else 1
if __name__ == '__main__': raise SystemExit(main())
