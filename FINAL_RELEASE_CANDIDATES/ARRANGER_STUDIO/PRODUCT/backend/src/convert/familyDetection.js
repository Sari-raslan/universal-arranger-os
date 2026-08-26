/**
 * Family detection with evidence — extension alone is insufficient for VERIFIED.
 */
import { familyFromExtension } from "./uaosNeutralIr.js";

const SIGNATURES = Object.freeze([
  { family: "midi", test: (buf) => buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "MThd", kind: "SIGNATURE_MATCH" },
  {
    family: "korg",
    test: (buf, ext) => {
      const head = buf.subarray(0, Math.min(16, buf.length)).toString("latin1");
      return /KORG|SET/i.test(head) || (ext === ".set" && buf.length > 64);
    },
    kind: "STRUCTURE_MATCH"
  },
  {
    family: "yamaha",
    test: (buf, ext) => {
      const head = buf.subarray(0, Math.min(32, buf.length)).toString("latin1");
      return /YAMAHA|STY/i.test(head) || ext === ".sty";
    },
    kind: "EXTENSION_OR_STRING_HINT"
  },
  {
    family: "sysex",
    test: (buf, ext) => ext === ".syx" || (buf.length > 0 && buf[0] === 0xf0),
    kind: "SIGNATURE_MATCH"
  }
]);

export function detectFamilyWithEvidence(buffer, extension, brand) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const ext = String(extension || "").toLowerCase();
  const extFamily = familyFromExtension(ext, brand);
  const evidence = [];
  let matchedFamily = extFamily.family;
  let confidence = "LOW";

  if (ext) evidence.push({ kind: "EXTENSION_MATCH", extension: ext });

  for (const sig of SIGNATURES) {
    if (sig.test(buf, ext)) {
      evidence.push({ kind: sig.kind, family: sig.family });
      if (sig.family === "midi" && sig.kind === "SIGNATURE_MATCH") {
        matchedFamily = "midi";
        confidence = "HIGH";
      } else if (sig.family === extFamily.family) {
        matchedFamily = sig.family;
        confidence = sig.kind === "SIGNATURE_MATCH" ? "HIGH" : "MEDIUM";
      }
    }
  }

  if (matchedFamily === "midi" && evidence.some((e) => e.kind === "SIGNATURE_MATCH")) {
    confidence = "HIGH";
  } else if (evidence.some((e) => e.kind === "STRUCTURE_MATCH")) {
    confidence = "MEDIUM";
  } else if (ext && !evidence.some((e) => e.kind === "SIGNATURE_MATCH")) {
    confidence = "EXTENSION_ONLY";
  }

  return {
    ok: true,
    family: matchedFamily,
    extension: ext,
    brand: brand || null,
    EXTENSION_MATCH: Boolean(ext),
    SIGNATURE_MATCH: evidence.some((e) => e.kind === "SIGNATURE_MATCH"),
    STRUCTURE_MATCH: evidence.some((e) => e.kind === "STRUCTURE_MATCH"),
    CONFIDENCE: confidence,
    evidence,
    verified: confidence === "HIGH"
  };
}
