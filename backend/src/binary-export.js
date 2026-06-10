export function binaryExportPlan(target, project = {}) {
  return {
    ok:true,
    target,
    status:"binary-export-foundation",
    warning:"Native binary writer still requires reverse-engineering/spec implementation.",
    plannedWriters:{
      korg:["SET/KST parser","style section mapping","CRC/checksum"],
      yamaha:["STY/SFF mapping","CASM section","OTS later"],
      roland:["STL mapping","variation/fill mapping"],
      ketron:["PAT mapping","drum/bass/chord parts"]
    },
    project
  };
}
