from pathlib import Path
import json, zipfile, re
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'v136_rc_validator/UAOS_V136_STYLE_PACKAGE_RC_VALIDATOR_RESULTS.json'
SELF=Path(__file__).resolve(); checks=[]
def add(n,o,d=''): checks.append({'name':n,'ok':bool(o),'detail':d})
sections=['intro_1','intro_2','variation_a','variation_b','variation_c','variation_d','fill_a','fill_b','fill_c','fill_d','break','ending_1','ending_2']
try:
    style=json.loads((BASE/'v132_rc_style_files/UAOS_V132_STYLE_PACKAGE_RC.uaosstyle.json').read_text(encoding='utf-8')); add('RC style JSON exists and parses',True)
    for s in sections: add('section exists '+s,s in style.get('sections',{}),s)
except Exception as e: add('RC style JSON exists and parses',False,str(e))
try: json.loads((BASE/'v132_rc_style_files/UAOS_V132_SECTION_STYLE_PACKAGE_RC.style.json').read_text(encoding='utf-8')); add('RC section style JSON exists and parses',True)
except Exception as e: add('RC section style JSON exists and parses',False,str(e))
midis=list((BASE/'v133_rc_midi_bundle/midi').glob('UAOS_V122_*.mid'))
add('all section MIDI files exist',len(midis)==13,str(len(midis)))
for f in midis+[BASE/'v133_rc_midi_bundle/midi/UAOS_V125_FULL_STYLE_SYNC_EXPORT.mid']:
    data=f.read_bytes() if f.exists() else b''; add('MIDI valid '+f.name,data.startswith(b'MThd') and b'MTrk' in data,str(f))
allowed={'.mid','.json','.md','.html','.txt'}; forbidden={'.set','.sty','.prf','.prs','.kst','.wav','.mp3'}
try:
    with zipfile.ZipFile(BASE/'v135_rc_package_zip/UAOS_V135_STYLE_PACKAGE_RC.zip') as z:
        names=z.namelist(); bad=[n for n in names if Path(n).suffix.lower() not in allowed]; forb=[n for n in names if Path(n).suffix.lower() in forbidden]
        add('RC ZIP exists and opens',True,str(len(names))); add('ZIP contains only allowed types',not bad,', '.join(bad)); add('ZIP contains no forbidden types',not forb,', '.join(forb))
except Exception as e: add('RC ZIP exists and opens',False,str(e))
patterns=[re.compile(r'korg writer implemented:\s*yes|korg_writer_implemented"?\s*:\s*true|real_korg_writer_used"?\s*:\s*true|korg output:\s*yes|korg_output"?\s*:\s*true',re.I),re.compile(r'usb write:\s*yes|usb_write"?\s*:\s*true|usb path:\s*[A-Z]:',re.I),re.compile(r'pa3x load:\s*yes|pa3x_load"?\s*:\s*true',re.I),re.compile(r'app\.jsx touched:\s*yes|app_jsx_touched"?\s*:\s*true|react integration:\s*yes|react_integration"?\s*:\s*true',re.I),re.compile(r'deploy/payment:\s*yes|deploy_payment"?\s*:\s*true|deploy:\s*yes|payment:\s*yes',re.I),re.compile(r'compatibility claim:\s*yes|(?<!no_korg_)compatibility_claim"?\s*:\s*true',re.I),re.compile(r'pa3x-ready claim:\s*yes|pa3x_ready_claim"?\s*:\s*true',re.I)]
for f in BASE.rglob('*'):
    if f.is_file():
        add('forbidden extension '+f.name,f.suffix.lower() not in forbidden,str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py'} and f.resolve()!=SELF and f.resolve()!=OUT.resolve():
            text=f.read_text(encoding='utf-8',errors='ignore'); hits=[p.pattern for p in patterns if p.search(text)]
            add('safety text '+f.name,not hits,'; '.join(hits))
result={'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL','checks':checks}; OUT.write_text(json.dumps(result,indent=2),encoding='utf-8')
if result['status']!='PASS': raise SystemExit(1)
