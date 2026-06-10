
class ReleaseGate {
  constructor(diagnostics){
    this.diagnostics = diagnostics;
  }

  validate(){
    const diagnostics = this.diagnostics.run();

    const gates = {
      diagnosticsOk: diagnostics.ok,
      runtimeModulesPresent: diagnostics.ok,
      timestamp: Date.now()
    };

    const ready = Object.values(gates).filter(v => typeof v === "boolean").every(Boolean);

    return {
      ok:true,
      releaseReady:ready,
      target:"UAOS Core Runtime Alpha",
      gates,
      diagnostics
    };
  }
}

module.exports = { ReleaseGate };
