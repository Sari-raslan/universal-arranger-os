from pathlib import Path
import json, zipfile, re
BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "validators" / "UAOS_PRIORITY_LIBRARY_MIDI_TEST_VALIDATOR_RESULTS.json"
REQUIRED_MIDI = [
    BASE / "midi" / "UAOS_PRIORITY_LIBRARY_TEST_ARRANGEMENT.mid",
    BASE / "midi" / "UAOS_PRIORITY_LIBRARY_SECTION_TEST.mid",
    BASE / "midi" / "UAOS_PRIORITY_LIBRARY_MULTITRACK_TEST.mid",
]
REQUIRED_JSON = [
    BASE / "metadata" / "UAOS_PRIORITY_LIBRARY_MIDI_PROJECT.json",
    BASE / "metadata" / "UAOS_PRIORITY_LIBRARY_MIDI_ROLE_MAP.json",
    BASE / "metadata" / "UAOS_PRIORITY_LIBRARY_SECTION_MAP.json",
    BASE / "metadata" / "UAOS_PRIORITY_LIBRARY_PRESET_USAGE_MAP.json",
    BASE / "metadata" / "UAOS_PRIORITY_LIBRARY_MIDI_GENERATION_TRACE.json",
]
REQUIRED_OTHER = [
    BASE / "exports" / "UAOS_PRIORITY_LIBRARY_MIDI_TEST_PACKAGE.zip",
    BASE / "exports" / "UAOS_PRIORITY_LIBRARY_MIDI_TEST_PACKAGE_MANIFEST.json",
    BASE / "package" / "UAOS_PRIORITY_LIBRARY_MIDI_TEST_README.md",
    BASE / "package" / "UAOS_PRIORITY_LIBRARY_CUBASE_TEST_STEPS.md",
    BASE / "package" / "UAOS_PRIORITY_LIBRARY_FEEDBACK_FORM.md",
    BASE / "dashboards" / "UAOS_PRIORITY_LIBRARY_MIDI_TEST_DASHBOARD.html",
    BASE / "dashboards" / "UAOS_PRIORITY_LIBRARY_MIDI_OWNER_DASHBOARD.html",
]
FORBIDDEN_EXT = {'.set','.sty','.prf','.prs','.kst','.wav','.mp3'}
FORBIDDEN_PATTERNS = [
    re.compile(r'proprietary sample extraction:\s*yes', re.I),
    re.compile(r'commercial library copy:\s*yes', re.I),
    re.compile(r'(kontakt|native instruments|\bni\b).*(path|source|used|included)', re.I),
    re.compile(r'usb write:\s*yes|copy to usb:\s*yes|usb path:\s*[A-Z]:', re.I),
    re.compile(r'pa3x load:\s*yes', re.I),
    re.compile(r'korg writer:\s*yes|korg output:\s*yes', re.I),
    re.compile(r'app\.jsx touched:\s*yes|react integration:\s*yes', re.I),
    re.compile(r'deploy/payment:\s*yes|deploy:\s*yes|payment:\s*yes', re.I),
    re.compile(r'compatibility claim:\s*yes', re.I),
    re.compile(r'pa3x-ready claim:\s*yes|pa3x ready:\s*yes', re.I),
]
checks=[]
def add(name, ok, detail=''):
    checks.append({'name':name,'ok':bool(ok),'detail':detail})
for f in REQUIRED_MIDI:
    ok = f.exists() and f.read_bytes().startswith(b'MThd') and b'MTrk' in f.read_bytes()
    add(f'MIDI valid {f.name}', ok, str(f))
for f in REQUIRED_JSON:
    try:
        json.loads(f.read_text(encoding='utf-8'))
        add(f'JSON parses {f.name}', True, str(f))
    except Exception as exc:
        add(f'JSON parses {f.name}', False, str(exc))
for f in REQUIRED_OTHER:
    add(f'exists {f.name}', f.exists(), str(f))
zip_path = BASE / "exports" / "UAOS_PRIORITY_LIBRARY_MIDI_TEST_PACKAGE.zip"
allowed_zip_ext = {'.mid','.json','.md'}
try:
    with zipfile.ZipFile(zip_path) as z:
        names = z.namelist()
        bad = [n for n in names if Path(n).suffix.lower() not in allowed_zip_ext]
        forbidden = [n for n in names if Path(n).suffix.lower() in FORBIDDEN_EXT]
        add('ZIP opens', True, f'{len(names)} entries')
        add('ZIP contains only allowed file types', not bad, ', '.join(bad))
        add('ZIP contains no forbidden audio/KORG file types', not forbidden, ', '.join(forbidden))
except Exception as exc:
    add('ZIP opens', False, str(exc))
SELF = Path(__file__).resolve()
for f in BASE.rglob('*'):
    if f.is_file():
        add(f'forbidden extension {f.name}', f.suffix.lower() not in FORBIDDEN_EXT, str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py'} and f != OUT and f.resolve() != SELF:
            text = f.read_text(encoding='utf-8', errors='ignore')
            hits = [p.pattern for p in FORBIDDEN_PATTERNS if p.search(text)]
            add(f'safety text {f.name}', not hits, '; '.join(hits))
result = {'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL', 'checks':checks}
OUT.write_text(json.dumps(result, indent=2), encoding='utf-8')
if result['status'] != 'PASS':
    raise SystemExit(1)
