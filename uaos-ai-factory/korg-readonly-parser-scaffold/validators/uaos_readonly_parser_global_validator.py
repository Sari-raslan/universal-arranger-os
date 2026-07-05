from pathlib import Path
import json,re
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'validators/UAOS_READONLY_PARSER_VALIDATOR_RESULTS.json'
SELF=Path(__file__).resolve(); checks=[]
def add(n,o,d=''): checks.append({'name':n,'ok':bool(o),'detail':d})
required=['src/uaos_readonly_hash_inspector.py','src/uaos_readonly_header_scanner.py','src/uaos_korg_readonly_parser_scaffold.py','v151_parser_scope/UAOS_V151_READONLY_PARSER_SCOPE.md','v152_fixture_intake/UAOS_V152_FIXTURE_INTAKE_TEMPLATE.md','v153_hash_inspector/UAOS_V153_HASH_INSPECTOR_SPEC.md','v154_header_scanner/UAOS_V154_HEADER_SCANNER_SPEC.md','v155_chunk_map_schema/UAOS_V155_READONLY_CHUNK_MAP_SCHEMA.json','v156_readonly_parser_scaffold/UAOS_V156_PARSER_SCAFFOLD_SPEC.md','v157_synthetic_dummy_dryrun/UAOS_V157_SYNTHETIC_DUMMY_DRYRUN_REPORT.json']
for r in required: add('required output '+r,(BASE/r).exists(),r)
try:
    dry=json.loads((BASE/'v157_synthetic_dummy_dryrun/UAOS_V157_SYNTHETIC_DUMMY_DRYRUN_REPORT.json').read_text(encoding='utf-8'))
    add('dummy dry-run PASS',dry.get('dry_run_pass') is True,str(dry.get('dry_run_pass')))
except Exception as e: add('dummy dry-run PASS',False,str(e))
forbidden={'.set','.sty','.prf','.prs','.kst'}
patterns=[re.compile(r'writer_implemented"?\s*:\s*true|korg writer implemented:\s*yes|korg output:\s*yes|korg_output"?\s*:\s*true',re.I),re.compile(r'usb write:\s*yes|usb_write"?\s*:\s*true|usb path:\s*[A-Z]:|copy to usb:\s*yes',re.I),re.compile(r'pa3x load:\s*yes|(?<!no_)pa3x_load"?\s*:\s*true',re.I),re.compile(r'app\.jsx touched:\s*yes|app_jsx_touched"?\s*:\s*true|react integration:\s*yes|react_integration"?\s*:\s*true',re.I),re.compile(r'deploy/payment:\s*yes|deploy_payment"?\s*:\s*true|deploy:\s*yes|payment:\s*yes',re.I),re.compile(r'compatibility claim:\s*yes|compatibility_claim"?\s*:\s*true',re.I),re.compile(r'pa3x-ready claim:\s*yes|pa3x_ready_claim"?\s*:\s*true',re.I),re.compile(r'\bopen\([^\)]*,\s*["\'](?:w|a|x|r\+|w\+|a\+)',re.I)]
read_only_labels=0
for f in BASE.rglob('*'):
    if f.is_file():
        add('no output KORG extension '+f.name,f.suffix.lower() not in forbidden,str(f))
        if f.suffix.lower() in {'.md','.json','.html','.txt','.py'} and f.resolve()!=SELF and f.resolve()!=OUT.resolve():
            text=f.read_text(encoding='utf-8',errors='ignore')
            if 'read-only' in text.lower() or 'read only' in text.lower(): read_only_labels += 1
            hits=[p.pattern for p in patterns if p.search(text)]
            add('safety text '+f.name,not hits,'; '.join(hits))
add('read-only labels exist',read_only_labels>=5,str(read_only_labels))
result={'status':'PASS' if all(c['ok'] for c in checks) else 'FAIL','checks':checks}; OUT.write_text(json.dumps(result,indent=2),encoding='utf-8')
if result['status']!='PASS': raise SystemExit(1)
