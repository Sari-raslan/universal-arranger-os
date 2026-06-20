export function runQaChecklist() {
  return [
    { id: "build", status: "manual-check-required" },
    { id: "github-pages", status: "manual-check-required" },
    { id: "payment-links", status: "manual-check-required" },
    { id: "mobile-layout", status: "manual-check-required" },
    { id: "runtime-modules", status: "scaffolded" }
  ];
}
