#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
IN=ROOT/'02_import_inputs'
OUT=ROOT/'05_regenerated_outputs'
MIDI=ROOT/'06_midi_regeneration'/'SARI_ARABIC_POP_STYLE_V4_REGENERATED.mid'
OUT.mkdir(parents=True, exist_ok=True); MIDI.parent.mkdir(parents=True, exist_ok=True)
MARKERS=['PC_ONLY','UAOS_FORMAT','TEST_UNVERIFIED','NOT_FOR_PA3X_LOAD','NOT_FOR_USB_TRANSFER','NOT_COMPATIBILITY_VERIFIED']
def load(name): return json.loads((IN/name).read_text(encoding='utf-8-sig'))
project=load('SAMPLE_EDITED_PROJECT_V4.json'); style=load('SAMPLE_EDITED_STYLE_V4.json'); library=load('SAMPLE_EDITED_LIBRARY_BINDING_V4.json')
project_required=['project_name','style_name','tempo','meter','chords','sections','tracks','safety_labels']
style_required=['style_name','tempo','meter','chords','sections','tracks','safety_labels']
library_required=['arabic_strings_preset','track_bindings','safety_labels']
for data,label,required in [(project,'project',project_required),(style,'style',style_required),(library,'library',library_required)]:
    missing=[k for k in required if k not in data]
    if missing: raise SystemExit(f'{label} missing {missing}')
for data in (project,style,library):
    text=json.dumps(data)
    for marker in MARKERS:
        if marker not in text: raise SystemExit(f'missing marker {marker}')
regen_project={'safety_labels':MARKERS,'project_name':project['project_name'],'style_name':project['style_name'],'tempo':project['tempo'],'meter':project['meter'],'chords':project['chords'],'sections':project['sections'],'tracks':project['tracks'],'library_binding_file':'SARI_LIBRARY_BINDINGS_V4_REGENERATED.json','source_inputs':['SAMPLE_EDITED_PROJECT_V4.json','SAMPLE_EDITED_STYLE_V4.json','SAMPLE_EDITED_LIBRARY_BINDING_V4.json']}
regen_style={'safety_labels':MARKERS,'style_name':style['style_name'],'tempo':style['tempo'],'meter':style['meter'],'chords':style['chords'],'sections':style['sections'],'tracks':style['tracks'],'arabic_strings_preset':style.get('arabic_strings_preset','Arabic Strings Tremolo Light'),'midi_preview':'../06_midi_regeneration/SARI_ARABIC_POP_STYLE_V4_REGENERATED.mid'}
regen_bindings={'safety_labels':MARKERS,'binding_name':'Sari Library Bindings V4 Regenerated','arabic_strings_preset':library.get('arabic_strings_preset','Arabic Strings Tremolo Light'),'track_bindings':library.get('track_bindings',{}),'samples':'NONE','metadata_only':True}
manifest={'safety_labels':MARKERS,'files':['SARI_UAOS_PC_SET_V4_REGENERATED.uaosproj','SARI_ARABIC_POP_STYLE_V4_REGENERATED.uaosstyle','SARI_LIBRARY_BINDINGS_V4_REGENERATED.json'],'midi':'../06_midi_regeneration/SARI_ARABIC_POP_STYLE_V4_REGENERATED.mid','writer':'uaos_pc_writer_v4_import_regenerate.py'}
for name,data in [('SARI_UAOS_PC_SET_V4_REGENERATED.uaosproj',regen_project),('SARI_ARABIC_POP_STYLE_V4_REGENERATED.uaosstyle',regen_style),('SARI_LIBRARY_BINDINGS_V4_REGENERATED.json',regen_bindings),('UAOS_SET_V4_REGENERATED_MANIFEST.json',manifest)]:
    (OUT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
def vlq(n):
    b=[n & 0x7F]; n >>= 7
    while n: b.insert(0,(n & 0x7F)|0x80); n >>= 7
    return bytes(b)
def ev(delta,data): return vlq(delta)+bytes(data)
tpq=480; track=bytearray(); track += ev(0,[0xFF,0x03,0x16]) + b'UAOS V4 MIDI Regenerated'; track += ev(0,[0xFF,0x51,0x03,0x08,0xF0,0xD2]); track += ev(0,[0xFF,0x58,0x04,0x04,0x02,0x18,0x08]); track += ev(0,[0xC0,48])
chord_notes={'Dm':[62,65,69],'Bb':[58,62,65],'C':[60,64,67],'A7':[57,61,64,67]}
for chord in style['chords']*4:
    notes=chord_notes.get(chord,[60,64,67])
    for note in notes: track += ev(0,[0x90,note,68])
    track += ev(tpq*2,[0x80,notes[0],0])
    for note in notes[1:]: track += ev(0,[0x80,note,0])
for note in [74,77,79,81,84,81,79,77,74,72,69,69]:
    track += ev(0,[0x90,note,76]); track += ev(tpq//2,[0x80,note,0])
track += ev(0,[0xFF,0x2F,0x00])
header=b'MThd'+(6).to_bytes(4,'big')+(0).to_bytes(2,'big')+(1).to_bytes(2,'big')+tpq.to_bytes(2,'big')
MIDI.write_bytes(header+b'MTrk'+len(track).to_bytes(4,'big')+bytes(track))
print(json.dumps({'status':'PASS','outputs':str(OUT),'midi':str(MIDI)},indent=2))

