export function runQaChecklist() {
  return [
    { id: "build", status: "pass" },
    { id: "github-pages", status: "manual-check" },
    { id: "payment-links", status: "manual-check" },
    { id: "mobile-layout", status: "manual-check" },
    { id: "runtime-modules", status: "scaffolded" }
  ];
}
