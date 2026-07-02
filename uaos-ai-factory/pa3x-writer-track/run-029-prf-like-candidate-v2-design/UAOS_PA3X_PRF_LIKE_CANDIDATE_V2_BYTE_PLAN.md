# UAOS PA3X PRF-like Candidate V2 Byte Plan

Status: TEST_UNVERIFIED / DO NOT LOAD

File: `UAOS_TEST_UNVERIFIED_MINIMAL_002.PRF`
Size: 4096 bytes
SHA256: `72d48e42ecc66a2c7424d03147ad6292be33b0af5374cbf4d140d7eb41aa9742`

Synthetic layout:
- 0x0000: UAOS synthetic file marker
- 0x0004: TU02 version marker
- 0x0008: declared size
- 0x000C: generic KORF structural marker
- 0x0010: TEST_UNVERIFIED label
- 0x0040 / 0x0080: repeated generic KORF structural markers
- 0x0100: synthetic metadata marker
- 0x0200 / 0x0400 / 0x0800: synthetic region markers
- 0x0C00: synthetic footer marker

No audio/sample data. No personal data. No fixture byte copy.
