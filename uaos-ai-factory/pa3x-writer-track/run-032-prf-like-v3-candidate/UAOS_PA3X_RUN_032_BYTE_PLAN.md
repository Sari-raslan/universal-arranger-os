# UAOS PA3X Run 032 Byte Plan

Status: TEST_UNVERIFIED / LOCAL ONLY
Candidate: UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF
Size: 24576 bytes
SHA256: b6ab635a30ac483d910a16008d4083f85849b100f36b2bf85641cf513de18e21

## Source
Synthetic UAOS metadata only. No fixture bytes were copied. No audio or sample data is included.

## Layout
- Offset 0: synthetic header marker KORFUAOS_TEST_003
- Offset 17: synthetic stable-offset marker R1TEST
- Offset 23: synthetic stable-offset marker and TEST_UNVERIFIED label
- Offset 256: synthetic metadata safety marker
- Offsets 4096, 8192, 12288, 16384, 20480: unknown-region placeholders, synthetic only
- Offset 24320: synthetic footer marker

## Safety
This is not for keyboard use. Do not copy it to removable media. Do not load it on PA3X. Do not overwrite keyboard memory. Run 033 must inspect the binary before any later approval gate exists.
