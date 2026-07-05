from pathlib import Path
import json, zipfile, re
BASE = Path(__file__).resolve().parents[1]
OUT = BASE/'v105_style_validator/UAOS_V105_STYLE_EXPORT_VALIDATOR_RESULTS.json'
SELF = Path(__file__).resolve()
checks=[]
def add(name, ok, detail=''):
    checks.append({'name':name,'ok':bool(ok),'detail':detail})
style = BASE/'v102_uaos_style_file/UAOS_V102_FIRST_REAL_UAOS_STYLE_FILE.uaosstyle.json'
section = BASE/'v103_section_style_package/UAOS_V103_SECTION_STYLE_PACKAGE.style.json'
zip_path = BASE/'v104_generic_style_zip/UAOS_V104_GENERIC_STYLE_PACKAGE.zip'
try:
    data=json.loads(style.read_text(encoding='utf-8'))
    add('UAOS style file exists and parses', True, str(style))
    for s in ['intro','variation_a','variation_b','variation_c','variation_d','fill','break','ending']:
        add(f'required section {s}', s in data.get('sections',{}), s)
    for ref in data.get('midi_refs',[]):
        add(f'MIDI ref exists {ref.get("id")}', Path(ref.get('path','')).exists(), ref.get('path',''))
except Exception as exc:
    add('UAOS style file exists and parses', False, str(exc))
try:
    json.loads(section.read_text(encoding='utf-8'))
    add('section style package parses', True, str(section))
except Exception as exc:
    add('section style package parses', False, str(exc))
allowed = {'.json','.md','.mid'}
forbidden_ext = {'.set','.sty','.prf','.prs','.kst','.wav','.mp3'}
try:
    with zipfile.ZipFile(zip_path) as z:
        names=z.namelist()
        bad=[n for n in names if Path(n).suffix.lower() not in allowed]
        forb=[n for n in names if Path(n).suffix.lower() in forbidden_ext]
        add('generic ZIP exists and opens', True, f'{len(names)} entries')
        add('ZIP contains only allowed types', not bad, ', '.join(bad))
        add('ZIP contains no forbidden types', not forb, ', '.join(forb))
except Exception as exc:
    add('generic ZIP exists and opens', False, str(exc))
patterns = [
re.compile(r'korg writer implemented:\s*yes|real_korg_writer_used"?\s*:\s*true|korg output:\s*yes|korg_output"?\s*:\s*true', re.I),
re.compile(r'usb write:\s*yes|usb_write"?\s*:\s*true|copy to usb:\s*yes|usb path:\s*[A-Z]:', re.I),
re.compile(r'pa3x load:\s*yes|pa3x_ready"?\s*:\s*true', re.I),
re.compile(r'app\.jsx touched:\s*yes|react integration:\s*yes', re.I),
re.compile(r'deploy/payment:\s*yes|deploy:\s*yes|payment:\s*yes', re.I),
re.compile(r'compatibility claim:\s*yes|compatibility_claim"?\s*:\s*true', re.I),
re.compile(r'pa3x-ready claim:\s*yes', re.I),
]
for f in BASE.rglob('*'):
    if f.is_file():
        add(f'forbidden extension {f.name}', f.suffix.lower() not in forbidden_ext, str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py'} and f.resolve()!=SELF and f.resolve()!=OUT.resolve():
            text=f.read_text(encoding='utf-8', errors='ignore')
            hits=[p.pattern for p in patterns if p.search(text)]
            add(f'safety text {f.name}', not hits, '; '.join(hits))
result={'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL','checks':checks}
OUT.write_text(json.dumps(result, indent=2), encoding='utf-8')
if result['status']!='PASS': raise SystemExit(1)
