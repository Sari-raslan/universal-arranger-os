from pathlib import Path
import json, zipfile, re
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'validators/UAOS_STYLE_MIDI_SYNC_VALIDATOR_RESULTS.json'
SELF=Path(__file__).resolve(); checks=[]
def add(n,o,d=''): checks.append({'name':n,'ok':bool(o),'detail':d})
midis=list((BASE/'v122_section_midi_exports/midi').glob('*.mid'))
add('all V122 MIDI files exist',len(midis)==13,str(len(midis)))
for f in midis+[BASE/'v125_full_style_midi_export/UAOS_V125_FULL_STYLE_SYNC_EXPORT.mid']:
    data=f.read_bytes() if f.exists() else b''; add('MIDI valid '+f.name,data.startswith(b'MThd') and b'MTrk' in data,str(f))
try: json.loads((BASE/'v126_style_package_v3_synced/UAOS_V126_SYNCED_STYLE_PACKAGE_V3.uaosstyle.json').read_text(encoding='utf-8')); add('V126 style package v3 parses',True)
except Exception as e: add('V126 style package v3 parses',False,str(e))
allowed={'.mid','.json','.md','.txt'}; forbidden={'.set','.sty','.prf','.prs','.kst','.wav','.mp3'}
try:
    with zipfile.ZipFile(BASE/'v127_section_midi_zip/UAOS_V127_STYLE_SECTION_MIDI_PACKAGE.zip') as z:
        names=z.namelist(); bad=[n for n in names if Path(n).suffix.lower() not in allowed]; forb=[n for n in names if Path(n).suffix.lower() in forbidden]
        add('V127 ZIP exists and opens',True,str(len(names))); add('ZIP contains only allowed types',not bad,', '.join(bad)); add('ZIP contains no forbidden types',not forb,', '.join(forb))
except Exception as e: add('V127 ZIP exists and opens',False,str(e))
patterns=[re.compile(r'korg writer implemented:\s*yes|korg_writer_implemented"?\s*:\s*true|korg output:\s*yes|korg_output"?\s*:\s*true',re.I),re.compile(r'usb write:\s*yes|usb_write"?\s*:\s*true|usb path:\s*[A-Z]:',re.I),re.compile(r'pa3x load:\s*yes|pa3x_load"?\s*:\s*true',re.I),re.compile(r'app\.jsx touched:\s*yes|app_jsx_touched"?\s*:\s*true',re.I),re.compile(r'deploy/payment:\s*yes|deploy_payment"?\s*:\s*true|deploy:\s*yes|payment:\s*yes',re.I),re.compile(r'compatibility claim:\s*yes|(?<!no_korg_)compatibility_claim"?\s*:\s*true',re.I),re.compile(r'pa3x-ready claim:\s*yes|pa3x_ready_claim"?\s*:\s*true',re.I)]
for f in BASE.rglob('*'):
    if f.is_file():
        add('forbidden extension '+f.name,f.suffix.lower() not in forbidden,str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py'} and f.resolve()!=SELF and f.resolve()!=OUT.resolve():
            text=f.read_text(encoding='utf-8',errors='ignore'); hits=[p.pattern for p in patterns if p.search(text)]
            add('safety text '+f.name,not hits,'; '.join(hits))
result={'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL','checks':checks}; OUT.write_text(json.dumps(result,indent=2),encoding='utf-8')
if result['status']!='PASS': raise SystemExit(1)
