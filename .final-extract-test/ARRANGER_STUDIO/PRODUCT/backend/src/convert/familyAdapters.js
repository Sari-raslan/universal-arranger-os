/**
 * SysEx inspect adapter. Counts F0/F7 blocks. Never claims hardware write.
 */
export function inspectSysex(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const blocks = [];
  let i = 0;
  while (i < buf.length) {
    if (buf[i] === 0xf0) {
      let j = i + 1;
      while (j < buf.length && buf[j] !== 0xf7) j += 1;
      const end = j < buf.length ? j : buf.length - 1;
      const slice = buf.subarray(i, end + 1);
      blocks.push({
        start: i,
        length: slice.length,
        manufacturer: slice.length > 1 ? slice[1] : null,
        terminated: buf[end] === 0xf7
      });
      i = end + 1;
      continue;
    }
    i += 1;
  }
  return {
    ok: true,
    level: "INSPECT",
    family: "sysex",
    blockCount: blocks.length,
    blocks,
    hexPreview: buf.subarray(0, 64).toString("hex"),
    write: "HARDWARE_REQUIRED",
    hardwareVerified: false,
    musicalQualityClaim: false
  };
}

export function familySupportMatrix() {
  return [
    { family: "midi", maxProven: "ROUNDTRIP_VERIFIED", write: false, note: "in-memory SMF only" },
    { family: "sysex", maxProven: "INSPECT", write: false, gate: "HARDWARE_REQUIRED" },
    { family: "korg", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" },
    { family: "yamaha", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" },
    { family: "roland", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" },
    { family: "ketron", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" }
  ];
}
