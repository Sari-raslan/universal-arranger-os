#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
required={
 'app':ROOT/'01_app'/'UAOS_PC_WORKSTATION_MVP_V4_IMPORT_REGENERATE.html',
 'sample_project':ROOT/'02_import_inputs'/'SAMPLE_EDITED_PROJECT_V4.json',
 'sample_style':ROOT/'02_import_inputs'/'SAMPLE_EDITED_STYLE_V4.json',
 'sample_library':ROOT/'02_import_inputs'/'SAMPLE_EDITED_LIBRARY_BINDING_V4.json',
 'schema':ROOT/'03_import_preview_schema'/'IMPORT_SCHEMA.json',
 'writer':ROOT/'04_writer_engine_v4'/'uaos_pc_writer_v4_import_regenerate.py',
 'regen_project':ROOT/'05_regenerated_outputs'/'SARI_UAOS_PC_SET_V4_REGENERATED.uaosproj',
 'regen_style':ROOT/'05_regenerated_outputs'/'SARI_ARABIC_POP_STYLE_V4_REGENERATED.uaosstyle',
 'regen_library':ROOT/'05_regenerated_outputs'/'SARI_LIBRARY_BINDINGS_V4_REGENERATED.json',
 'regen_manifest':ROOT/'05_regenerated_outputs'/'UAOS_SET_V4_REGENERATED_MANIFEST.json'}
markers=['PC_ONLY','UAOS_FORMAT','TEST_UNVERIFIED','NOT_FOR_PA3X_LOAD','NOT_FOR_USB_TRANSFER','NOT_COMPATIBILITY_VERIFIED']
forbidden=['PA3X_READY','KORG_COMPATIBLE','LOAD_TO_PA3X','USB_COPY_EXECUTED']
forbidden_paths=['App.jsx','owner-fixtures','deploy','payment']
res={'status':'PASS','checks':{},'warnings':[],'failures':[]}
for k,p in required.items():
    ok=p.exists(); res['checks'][f'{k}_exists']=ok
    if not ok: res['failures'].append(f'missing {k}: {p}')
midi=ROOT/'06_midi_regeneration'/'SARI_ARABIC_POP_STYLE_V4_REGENERATED.mid'; skip=ROOT/'06_midi_regeneration'/'MIDI_REGENERATION_SKIPPED.md'
res['checks']['midi_exists_or_skipped']=midi.exists() or skip.exists()
if not res['checks']['midi_exists_or_skipped']: res['failures'].append('MIDI missing and no skipped report')
text='\n'.join(p.read_text(encoding='utf-8',errors='ignore') for p in ROOT.rglob('*') if p.is_file() and p.suffix.lower() not in {'.mid','.py'} and 'VALIDATOR_RESULT' not in p.name and 'VALIDATOR_REPORT' not in p.name and 'validator' not in str(p).lower())
for m in markers:
    ok=m in text; res['checks'][f'marker_{m}']=ok
    if not ok: res['failures'].append(f'missing marker {m}')
for f in forbidden:
    ok=f not in text; res['checks'][f'forbidden_absent_{f}']=ok
    if not ok: res['failures'].append(f'forbidden string present {f}')
for p in ROOT.rglob('*'):
    rel=str(p.relative_to(ROOT)).replace('\\','/')
    for term in forbidden_paths:
        if term in rel: res['failures'].append(f'forbidden path term {term}: {rel}')
if any(x in text for x in ['PROPRIETARY_SAMPLE_PATH','OWNER_FIXTURE_PATH','EXTERNAL_OUTPUT_PATH']): res['failures'].append('forbidden reference marker present')
if res['failures']: res['status']='FAIL'
(ROOT/'07_validator'/'VALIDATOR_RESULT.json').write_text(json.dumps(res,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
report=['# V4 Validator Report','','PC_ONLY / UAOS_FORMAT / TEST_UNVERIFIED / NOT_FOR_PA3X_LOAD / NOT_FOR_USB_TRANSFER / NOT_COMPATIBILITY_VERIFIED','',f"Status: {res['status']}",'']
report += [f"- {k}: {'PASS' if v else 'FAIL'}" for k,v in res['checks'].items()]
if res['failures']: report += ['', 'Failures:'] + [f'- {x}' for x in res['failures']]
(ROOT/'reports'/'V4_VALIDATOR_REPORT.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
print(json.dumps(res,indent=2,ensure_ascii=False))
