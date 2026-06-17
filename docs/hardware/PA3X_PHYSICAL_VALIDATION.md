# KORG PA3X Physical USB MIDI Validation

Date: 2026-06-17

## Verified device

- Windows PnP device: `KORG Pa3X`
- Manufacturer: `KORG Inc.`
- Device status: `OK`
- MIDI input: `Pa3X 1 KEYBOARD`
- MIDI output: `Pa3X 1 SOUND`

## Verified PA3X to UAOS/Windows

- Active Sensing (`FE`)
- Note On / Note Off on channel 1
- MIDI Clock (`F8`)
- Start (`FA`)
- Stop (`FC`)

## Verified UAOS/Windows to PA3X

- Note On / Note Off with physical audible confirmation
- CC123 panic / All Notes Off
- Start + 24 PPQN MIDI Clock + Stop with physical arranger response
- Safe stop and reset behavior

## Safety boundary

The validation did not send or approve:

- undocumented SysEx
- Bulk Dump
- SET writes
- PCM writes
- firmware operations
- factory reset
- destructive memory commands

The hardware UI requires a selected physical output and explicit user confirmation before external clock transmission.