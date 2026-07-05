from pathlib import Path
import json, zipfile, re
BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "13_validators" / "UAOS_FINAL_LOCAL_OWNER_PROGRAM_V2_VALIDATOR_RESULTS.json"
SELF = Path(__file__).resolve()
checks=[]
def add(name, ok, detail=''):
    checks.append({'name':name,'ok':bool(ok),'detail':detail})
required = [
BASE/'00_OPEN_ME/OPEN_UAOS_FINAL_LOCAL_PROGRAM_V2.html', BASE/'00_OPEN_ME/OPEN_UAOS_FINAL_LOCAL_PROGRAM_V2.cmd', BASE/'01_program/UAOS_FINAL_LOCAL_PROGRAM_V2_HOME.html', BASE/'04_uaos_package/UAOS_V72_PROJECT_PACKAGE.uaos.json', BASE/'05_daw_test/UAOS_DAW_TEST_CENTER.html', BASE/'06_sound_library/UAOS_SOUND_LIBRARY_CENTER.html', BASE/'07_priority_library/UAOS_PRIORITY_LIBRARY_CENTER.html', BASE/'08_product_pages/UAOS_PRODUCT_PREVIEW_CENTER.html', BASE/'11_external_tester/UAOS_EXTERNAL_TESTER_START_HERE.md', BASE/'_package/UAOS_FINAL_LOCAL_OWNER_PROGRAM_V2_PACKAGE.zip']
for f in required: add(f'exists {f.name}', f.exists(), str(f))
for f in [BASE/'03_midi/UAOS_V71_REAL_MIDI_EXPORT_FOUNDATION.mid', BASE/'03_midi/UAOS_V81_SECTION_BASED_REAL_MIDI_EXPORT.mid', BASE/'03_midi/UAOS_V82_MULTITRACK_ARRANGEMENT_EXPORT.mid', BASE/'03_midi/UAOS_PRIORITY_LIBRARY_TEST_ARRANGEMENT.mid', BASE/'03_midi/UAOS_PRIORITY_LIBRARY_SECTION_TEST.mid', BASE/'03_midi/UAOS_PRIORITY_LIBRARY_MULTITRACK_TEST.mid']:
    data = f.read_bytes() if f.exists() else b''
    add(f'MIDI valid {f.name}', data.startswith(b'MThd') and b'MTrk' in data, str(f))
try:
    json.loads((BASE/'04_uaos_package/UAOS_V72_PROJECT_PACKAGE.uaos.json').read_text(encoding='utf-8'))
    add('UAOS package parses JSON', True)
except Exception as exc: add('UAOS package parses JSON', False, str(exc))
for z in ['UAOS_V73_GENERIC_STYLE_PACKAGE.zip','UAOS_V85_GENERIC_MIDI_TEST_PACKAGE.zip','UAOS_V89_FINAL_LOCAL_TRIAL_PACKAGE.zip','UAOS_V95_DAW_TEST_PACKAGE.zip','UAOS_PRIORITY_LIBRARY_MIDI_TEST_PACKAGE.zip']:
    add(f'required ZIP exists {z}', (BASE/'02_exports'/z).exists(), z)
for folder in ['09_dashboards','10_reports']:
    add(f'{folder} has files', any((BASE/folder).glob('*')), folder)
allowed_ext = {'.html','.cmd','.md','.json','.mid','.zip','.txt','.py'}
forbidden_ext = {'.set','.sty','.prf','.prs','.kst','.wav','.mp3'}
zip_path = BASE/'_package/UAOS_FINAL_LOCAL_OWNER_PROGRAM_V2_PACKAGE.zip'
try:
    with zipfile.ZipFile(zip_path) as z:
        names = z.namelist()
        bad = [n for n in names if Path(n).suffix.lower() not in allowed_ext]
        forb = [n for n in names if Path(n).suffix.lower() in forbidden_ext]
        add('final ZIP opens', True, f'{len(names)} entries')
        add('final ZIP contains only allowed file types', not bad, ', '.join(bad))
        add('final ZIP contains no forbidden file types', not forb, ', '.join(forb))
except Exception as exc: add('final ZIP opens', False, str(exc))
patterns = [
re.compile(r'usb write:\s*yes|copy to usb:\s*yes|usb path:\s*[A-Z]:', re.I),
re.compile(r'pa3x load:\s*yes', re.I),
re.compile(r'korg writer:\s*yes|korg output:\s*yes', re.I),
re.compile(r'proprietary sample extraction:\s*yes|proprietary extraction:\s*yes', re.I),
re.compile(r'commercial library copy:\s*yes', re.I),
re.compile(r'app\.jsx touched:\s*yes|react integration:\s*yes', re.I),
re.compile(r'deploy/payment:\s*yes|deploy:\s*yes|payment:\s*yes', re.I),
re.compile(r'compatibility claim:\s*yes', re.I),
re.compile(r'pa3x-ready claim:\s*yes|pa3x ready:\s*yes', re.I),
re.compile(r'(kontakt|native instruments|\bni\b).*(path|source|used|included|copy)', re.I),
]
for f in BASE.rglob('*'):
    if f.is_file():
        add(f'forbidden extension {f.name}', f.suffix.lower() not in forbidden_ext, str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py','.cmd'} and f.resolve() != SELF and f.resolve() != OUT.resolve() and not f.name.endswith('_validator.py'):
            text = f.read_text(encoding='utf-8', errors='ignore')
            hits = [p.pattern for p in patterns if p.search(text)]
            add(f'safety text {f.name}', not hits, '; '.join(hits))
result={'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL','checks':checks}
OUT.write_text(json.dumps(result, indent=2), encoding='utf-8')
if result['status'] != 'PASS': raise SystemExit(1)
