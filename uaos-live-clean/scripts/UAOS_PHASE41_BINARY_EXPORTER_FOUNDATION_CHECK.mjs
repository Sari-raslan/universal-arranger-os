import {
  createUaosSafeBinaryContainer,
  inspectUaosSafeBinaryContainer,
  validateUaosSafeBinaryContainer
} from "../src/hardware/binary/uaosBinaryExporterFoundation.js";

const targets = ["korg", "yamaha", "roland", "ketron"];

for (const target of targets) {
  const bytes = createUaosSafeBinaryContainer({
    target,
    projectName: `UAOS Phase 41 ${target}`,
    styleMap: {
      tempo: 96,
      sections: [{ id: "mainA", bars: 8 }]
    }
  });

  if (!(bytes instanceof Uint8Array)) {
    throw new Error(`${target}: not Uint8Array`);
  }

  const info = inspectUaosSafeBinaryContainer(bytes);
  if (info.magic !== "UAOSBIN1") {
    throw new Error(`${target}: bad magic`);
  }

  const valid = validateUaosSafeBinaryContainer(bytes);
  if (!valid.ok) {
    throw new Error(`${target}: ${valid.errors.join(", ")}`);
  }

  console.log(`PASS ${target}: ${bytes.length} bytes`);
}

console.log("PHASE 41 BINARY EXPORTER FOUNDATION CHECK PASS");
