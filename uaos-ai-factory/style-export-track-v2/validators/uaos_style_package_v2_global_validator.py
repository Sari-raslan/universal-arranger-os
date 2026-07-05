from pathlib import Path
import json, zipfile, re
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'validators/UAOS_STYLE_PACKAGE_V2_VALIDATOR_RESULTS.json'
SELF=Path(__file__).resolve(); checks=[]
def add(n,o,d=''): checks.append({'name':n,'ok':bool(o),'detail':d})
required=['v111_section_model_v2/UAOS_V111_SECTION_MODEL_V2.json','v112_variation_builder_v2/UAOS_V112_VARIATION_A_D_MODEL.json','v113_fill_break_ending_logic/UAOS_V113_FILL_BREAK_ENDING_LOGIC.json','v114_arranger_track_role_map_v2/UAOS_V114_ARRANGER_TRACK_ROLE_MAP_V2.json','v115_priority_library_binding/UAOS_V115_PRIORITY_LIBRARY_BINDING.json','v116_midi_reference_binding/UAOS_V116_MIDI_REFERENCE_BINDING.json','v117_generic_style_package_v2/UAOS_V117_GENERIC_STYLE_PACKAGE_V2.uaosstyle.json','v117_generic_style_package_v2/UAOS_V117_SECTION_STYLE_PACKAGE_V2.style.json','v117_generic_style_package_v2/UAOS_V117_GENERIC_STYLE_PACKAGE_V2.zip']
for r in required: add('required output '+r,(BASE/r).exists(),r)
sections=['intro_1','intro_2','variation_a','variation_b','variation_c','variation_d','fill_a','fill_b','fill_c','fill_d','break','ending_1','ending_2']
try:
    style=json.loads((BASE/'v117_generic_style_package_v2/UAOS_V117_GENERIC_STYLE_PACKAGE_V2.uaosstyle.json').read_text(encoding='utf-8'))
    add('V117 uaosstyle parses',True)
    for s in sections: add('required section '+s,s in style.get('sections',{}),s)
    for v in ['variation_a','variation_b','variation_c','variation_d']: add('variation exists '+v,v in style.get('variations',{}),v)
    for key in ['fills','break','endings']: add('fill break ending logic '+key,key in style.get('fill_break_ending_logic',{}),key)
except Exception as e: add('V117 uaosstyle parses',False,str(e))
try: json.loads((BASE/'v117_generic_style_package_v2/UAOS_V117_SECTION_STYLE_PACKAGE_V2.style.json').read_text(encoding='utf-8')); add('V117 style json parses',True)
except Exception as e: add('V117 style json parses',False,str(e))
try:
    bind=json.loads((BASE/'v115_priority_library_binding/UAOS_V115_PRIORITY_LIBRARY_BINDING.json').read_text(encoding='utf-8')); add('library bindings exist',len(bind.get('priority_library_binding',[]))==5)
except Exception as e: add('library bindings exist',False,str(e))
try:
    mb=json.loads((BASE/'v116_midi_reference_binding/UAOS_V116_MIDI_REFERENCE_BINDING.json').read_text(encoding='utf-8'))
    for ref in mb.get('midi_refs',[]): add('MIDI ref exists '+ref.get('id',''),Path(ref.get('path','')).exists(),ref.get('path',''))
except Exception as e: add('MIDI refs exist',False,str(e))
allowed={'.json','.md','.txt','.mid'}; forbidden={'.set','.sty','.prf','.prs','.kst','.wav','.mp3'}
try:
    with zipfile.ZipFile(BASE/'v117_generic_style_package_v2/UAOS_V117_GENERIC_STYLE_PACKAGE_V2.zip') as z:
        names=z.namelist(); bad=[n for n in names if Path(n).suffix.lower() not in allowed]; forb=[n for n in names if Path(n).suffix.lower() in forbidden]
        add('ZIP exists and opens',True,str(len(names))); add('ZIP contains only allowed files',not bad,', '.join(bad)); add('ZIP has no forbidden files',not forb,', '.join(forb))
except Exception as e: add('ZIP exists and opens',False,str(e))
patterns=[re.compile(r'korg writer implemented:\s*yes|korg_writer_implemented"?\s*:\s*true|korg output:\s*yes|korg_output"?\s*:\s*true',re.I),re.compile(r'usb write:\s*yes|usb_write"?\s*:\s*true|usb path:\s*[A-Z]:',re.I),re.compile(r'pa3x load:\s*yes|pa3x_load"?\s*:\s*true',re.I),re.compile(r'app\.jsx touched:\s*yes|app_jsx_touched"?\s*:\s*true',re.I),re.compile(r'deploy/payment:\s*yes|deploy_payment"?\s*:\s*true|deploy:\s*yes|payment:\s*yes',re.I),re.compile(r'compatibility claim:\s*yes|(?<!no_korg_)compatibility_claim"?\s*:\s*true',re.I),re.compile(r'pa3x-ready claim:\s*yes|pa3x_ready_claim"?\s*:\s*true',re.I)]
for f in BASE.rglob('*'):
    if f.is_file():
        add('forbidden extension '+f.name,f.suffix.lower() not in forbidden,str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py'} and f.resolve()!=SELF and f.resolve()!=OUT.resolve():
            text=f.read_text(encoding='utf-8',errors='ignore'); hits=[p.pattern for p in patterns if p.search(text)]
            add('safety text '+f.name,not hits,'; '.join(hits))
result={'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL','checks':checks}; OUT.write_text(json.dumps(result,indent=2),encoding='utf-8')
if result['status']!='PASS': raise SystemExit(1)
