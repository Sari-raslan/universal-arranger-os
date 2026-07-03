from pathlib import Path
root = Path(__file__).resolve().parents[1]
out = root / "06_midi_preview" / "SARI_ARABIC_POP_STYLE_PREVIEW_V2.mid"
def vlq(n):
    b=[n & 0x7F]; n >>= 7
    while n: b.insert(0,(n & 0x7F)|0x80); n >>= 7
    return bytes(b)
def ev(delta,data): return vlq(delta)+bytes(data)
tpq=480; track=bytearray()
track += ev(0,[0xFF,0x03,0x16]) + b"UAOS PC MIDI Preview V2"
track += ev(0,[0xFF,0x51,0x03,0x09,0x89,0x68])
track += ev(0,[0xFF,0x58,0x04,0x04,0x02,0x18,0x08])
track += ev(0,[0xC0,48])
for chord in ([[60,63,67],[56,60,63],[58,62,65],[55,59,62,65]]*4):
    for note in chord: track += ev(0,[0x90,note,66])
    track += ev(tpq*2,[0x80,chord[0],0])
    for note in chord[1:]: track += ev(0,[0x80,note,0])
for note in [72,75,77,79,82,80,79,75,77,75,72,70]:
    track += ev(0,[0x90,note,78]); track += ev(tpq//2,[0x80,note,0])
track += ev(0,[0xFF,0x2F,0x00])
header=b"MThd"+(6).to_bytes(4,"big")+(0).to_bytes(2,"big")+(1).to_bytes(2,"big")+tpq.to_bytes(2,"big")
out.write_bytes(header+b"MTrk"+len(track).to_bytes(4,"big")+bytes(track))
print(out)
