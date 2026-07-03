#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'03_writer_engine_v3'/'generated_outputs'
OUT.mkdir(parents=True, exist_ok=True)
MARKERS=['PC_ONLY','UAOS_FORMAT','TEST_UNVERIFIED','NOT_FOR_PA3X_LOAD','NOT_FOR_USB_TRANSFER','NOT_COMPATIBILITY_VERIFIED']
state=json.loads((ROOT/'02_editor_data'/'DEFAULT_PROJECT_EDITOR_STATE.json').read_text(encoding='utf-8-sig'))
project={'markers':MARKERS,'project_name':state['project_name'],'style_name':state['style_name'],'tempo':state['tempo'],'meter':state['meter'],'chords':state['chords'],'editor_source':'DEFAULT_PROJECT_EDITOR_STATE.json','safety_labels':MARKERS}
style={'markers':MARKERS,'style_name':state['style_name'],'tempo':state['tempo'],'meter':state['meter'],'chord_progression':state['chords'],'sections':state['sections'],'tracks':state['tracks'],'selected_library_preset':state['selected_library_preset'],'safety_labels':MARKERS}
bindings={'markers':MARKERS,'project':state['project_name'],'arabic_strings_preset':state['selected_library_preset'],'track_bindings':{t:('Arabic Strings Ensemble Soft' if t=='arabic_strings' else f'UAOS Synthetic {t} Placeholder') for t in state['tracks']},'metadata_only':True,'samples':'NONE','safety_labels':MARKERS}
manifest={'markers':MARKERS,'files':['SARI_UAOS_PC_SET_V3.uaosproj','SARI_ARABIC_POP_STYLE_V3.uaosstyle','SARI_LIBRARY_BINDINGS_V3.json'],'created_by':'uaos_pc_writer_v3.py','safety_labels':MARKERS}
for name,data in [('SARI_UAOS_PC_SET_V3.uaosproj',project),('SARI_ARABIC_POP_STYLE_V3.uaosstyle',style),('SARI_LIBRARY_BINDINGS_V3.json',bindings),('UAOS_SET_V3_MANIFEST.json',manifest)]:
    (OUT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'status':'PASS','output':str(OUT)},indent=2))

