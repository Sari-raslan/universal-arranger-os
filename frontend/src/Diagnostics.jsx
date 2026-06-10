import { UAOS_BUILD } from "./build-info.js";

export default function Diagnostics() {
  return (
    <div className="diag">
      <b>Self Diagnostics</b>
      <span>Build: {UAOS_BUILD.build}</span>
      <span>Mode: {UAOS_BUILD.mode}</span>
      <span>Expected Port: {UAOS_BUILD.expectedPort}</span>
      <span>Status: ACTIVE NEW UI</span>
    </div>
  );
}
