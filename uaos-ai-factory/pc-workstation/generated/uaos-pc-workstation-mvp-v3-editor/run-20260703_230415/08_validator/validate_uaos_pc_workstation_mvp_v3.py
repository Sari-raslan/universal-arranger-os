#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
required={
 'html':ROOT/'01_app'/'UAOS_PC_WORKSTATION_MVP_V3_EDITOR.html',
 'project_state':ROOT/'02_editor_data'/'DEFAULT_PROJECT_EDITOR_STATE.json',
 'style_state':ROOT/'02_editor_data'/'DEFAULT_STYLE_SECTION_STATE.json',
 'library_state':ROOT/'02_editor_data'/'DEFAULT_LIBRARY_SELECTION.json',
 'editor_schema':ROOT/'02_editor_data'/'EDITOR_SCHEMA.json',
 'writer_project':ROOT/'03_writer_engine_v3'/'generated_outputs'/'SARI_UAOS_PC_SET_V3.uaosproj',
 'writer_style':ROOT/'03_writer_engine_v3'/'generated_outputs'/'SARI_ARABIC_POP_STYLE_V3.uaosstyle',
 'writer_bindings':ROOT/'03_writer_engine_v3'/'generated_outputs'/'SARI_LIBRARY_BINDINGS_V3.json',
 'writer_manifest':ROOT/'03_writer_engine_v3'/'generated_outputs'/'UAOS_SET_V3_MANIFEST.json',
 'project_schema':ROOT/'04_project_editor'/'PROJECT_EDITOR_SCHEMA.json',
 'style_schema':ROOT/'05_style_section_editor'/'STYLE_SECTION_SCHEMA.json',
 'library_presets':ROOT/'06_library_selector'/'LIBRARY_PRESETS.json',
 'export_policy':ROOT/'07_exports'/'EXPORT_POLICY.json'}
markers=['PC_ONLY','UAOS_FORMAT','TEST_UNVERIFIED','NOT_FOR_PA3X_LOAD','NOT_FOR_USB_TRANSFER','NOT_COMPATIBILITY_VERIFIED']
forbidden=['PA3X_READY','KORG_COMPATIBLE','LOAD_TO_PA3X','USB_COPY_EXECUTED']
forbidden_paths=['App.jsx','owner-fixtures','deploy','payment']
res={'status':'PASS','checks':{},'warnings':[],'failures':[]}
for k,p in required.items():
    ok=p.exists(); res['checks'][f'{k}_exists']=ok
    if not ok: res['failures'].append(f'missing {k}: {p}')
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
if 'PROPRIETARY_SAMPLE_PATH' in text: res['failures'].append('proprietary sample reference present')
if res['failures']: res['status']='FAIL'
(ROOT/'08_validator'/'VALIDATOR_RESULT.json').write_text(json.dumps(res,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
report=['# V3 Validator Report','','PC_ONLY / UAOS_FORMAT / TEST_UNVERIFIED / NOT_FOR_PA3X_LOAD / NOT_FOR_USB_TRANSFER / NOT_COMPATIBILITY_VERIFIED','',f"Status: {res['status']}",'']
report += [f"- {k}: {'PASS' if v else 'FAIL'}" for k,v in res['checks'].items()]
if res['failures']: report += ['', 'Failures:'] + [f'- {x}' for x in res['failures']]
(ROOT/'reports'/'V3_VALIDATOR_REPORT.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
print(json.dumps(res,indent=2,ensure_ascii=False))

