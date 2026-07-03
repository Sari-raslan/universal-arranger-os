#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
required={
 'v5_project_folder':ROOT/'01_v5_save_load_project'/'sample_project_folder'/'SARI_UAOS_PC_PROJECT_V5',
 'v6_preview_player':ROOT/'02_v6_preview_player'/'UAOS_PREVIEW_PLAYER_V6.html',
 'v7_library_manager':ROOT/'03_v7_library_manager'/'UAOS_LIBRARY_MANAGER_V7.html',
 'v8_pack':ROOT/'04_v8_arabic_strings_pack'/'UAOS_ARABIC_STRINGS_PACK_V1.uaoslib',
 'v9_launcher':ROOT/'05_v9_final_launcher'/'UAOS_PC_WORKSTATION_FINAL_LAUNCHER_V9.html',
 'integrated_project':ROOT/'06_integrated_project'/'SARI_UAOS_PC_WORKSTATION_PROJECT_V9'/'project.uaosproj',
 'writer':ROOT/'07_integrated_writer'/'uaos_pc_workstation_writer_v9.py',
 'writer_project':ROOT/'07_integrated_writer'/'generated_outputs'/'SARI_UAOS_PC_WORKSTATION_PROJECT_V9.uaosproj',
 'writer_style':ROOT/'07_integrated_writer'/'generated_outputs'/'SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.uaosstyle'}
markers=['PC_ONLY','UAOS_FORMAT','TEST_UNVERIFIED','NOT_FOR_PA3X_LOAD','NOT_FOR_USB_TRANSFER']
forbidden=['PA3X_READY','KORG_COMPATIBLE','LOAD_TO_PA3X','USB_COPY_EXECUTED']
forbidden_paths=['App.jsx','owner-fixtures','deploy','payment']
res={'status':'PASS','checks':{},'warnings':[],'failures':[]}
for k,p in required.items():
    ok=p.exists(); res['checks'][f'{k}_exists']=ok
    if not ok: res['failures'].append(f'missing {k}: {p}')
midi=ROOT/'07_integrated_writer'/'generated_outputs'/'SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid'; skip=ROOT/'07_integrated_writer'/'generated_outputs'/'MIDI_SKIPPED_REPORT.md'
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
if any(x in text for x in ['PROPRIETARY_SAMPLE_PATH','OWNER_FIXTURE_PATH','EXTERNAL_WRITE_PATH']): res['failures'].append('forbidden reference marker present')
if res['failures']: res['status']='FAIL'
(ROOT/'08_validator'/'VALIDATOR_RESULT.json').write_text(json.dumps(res,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
report=['# Validator Report','','PC_ONLY / UAOS_FORMAT / TEST_UNVERIFIED / NOT_FOR_PA3X_LOAD / NOT_FOR_USB_TRANSFER','',f"Status: {res['status']}",'']
report += [f"- {k}: {'PASS' if v else 'FAIL'}" for k,v in res['checks'].items()]
if res['failures']: report += ['', 'Failures:'] + [f'- {x}' for x in res['failures']]
(ROOT/'reports'/'VALIDATOR_REPORT.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
print(json.dumps(res,indent=2,ensure_ascii=False))
