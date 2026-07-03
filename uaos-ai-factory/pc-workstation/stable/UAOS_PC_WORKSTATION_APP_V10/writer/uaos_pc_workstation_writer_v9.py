#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'07_integrated_writer'/'generated_outputs'
OUT.mkdir(parents=True, exist_ok=True)
MARKERS=['PC_ONLY','UAOS_FORMAT','TEST_UNVERIFIED','NOT_FOR_PA3X_LOAD','NOT_FOR_USB_TRANSFER']
sections=[{'name':'intro','bars':4},{'name':'verse','bars':16},{'name':'chorus','bars':16},{'name':'bridge','bars':8},{'name':'fill','bars':1},{'name':'ending','bars':4}]
tracks=['drums','bass','chords','pad','arabic_strings','melody_guide']
chords=['Dm','Bb','C','A7']
base={'safety_labels':MARKERS,'project_name':'Sari UAOS PC Workstation Project V9','style':'Arabic Pop Oriental Ballad V9','tempo':102,'meter':'4/4','chords':chords,'sections':sections,'tracks':tracks,'default_strings_preset':'Arabic Strings Tremolo Light'}
outputs={
 'SARI_UAOS_PC_WORKSTATION_PROJECT_V9.uaosproj':base,
 'SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.uaosstyle':{**base,'file_type':'style'},
 'SARI_ARABIC_STRINGS_BINDINGS_V9.json':{'safety_labels':MARKERS,'arabic_strings':'Arabic Strings Tremolo Light','pad':'Arabic Strings Pad Wide','melody_guide':'Arabic Violin Guide'},
 'SARI_UAOS_PC_WORKSTATION_V9_MANIFEST.json':{'safety_labels':MARKERS,'files':['SARI_UAOS_PC_WORKSTATION_PROJECT_V9.uaosproj','SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.uaosstyle','SARI_ARABIC_STRINGS_BINDINGS_V9.json','SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid']}}
for name,data in outputs.items(): (OUT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
def vlq(n):
    b=[n & 0x7F]; n >>= 7
    while n: b.insert(0,(n & 0x7F)|0x80); n >>= 7
    return bytes(b)
def ev(d,data): return vlq(d)+bytes(data)
tpq=480; track=bytearray(); track += ev(0,[0xFF,0x03,0x1D])+b'UAOS V9 PC Workstation MIDI'; us=int(60000000/102); track += ev(0,[0xFF,0x51,0x03,(us>>16)&255,(us>>8)&255,us&255]); track += ev(0,[0xFF,0x58,0x04,0x04,0x02,0x18,0x08]); track += ev(0,[0xC0,48])
notes={'Dm':[62,65,69],'Bb':[58,62,65],'C':[60,64,67],'A7':[57,61,64,67]}
for c in chords*4:
    ns=notes[c]
    for n in ns: track += ev(0,[0x90,n,68])
    track += ev(tpq*2,[0x80,ns[0],0])
    for n in ns[1:]: track += ev(0,[0x80,n,0])
for n in [74,77,81,84,83,81,77,74,72,69,69,74]: track += ev(0,[0x90,n,76]); track += ev(tpq//2,[0x80,n,0])
track += ev(0,[0xFF,0x2F,0x00]); header=b'MThd'+(6).to_bytes(4,'big')+(0).to_bytes(2,'big')+(1).to_bytes(2,'big')+tpq.to_bytes(2,'big')
(OUT/'SARI_ARABIC_POP_ORIENTAL_BALLAD_V9.mid').write_bytes(header+b'MTrk'+len(track).to_bytes(4,'big')+bytes(track))
print(json.dumps({'status':'PASS','output':str(OUT)},indent=2))
