export function productionChecklist() {
  return {
    ok: true,
    phase: 'production-optimization',
    checks: [
      { key: 'website', status: 'online' },
      { key: 'pricing', status: 'online' },
      { key: 'payments', status: 'paypal-links-ready' },
      { key: 'frontend-build', status: 'passing' },
      { key: 'backend-api', status: 'passing' },
      { key: 'android', status: 'needs-device-validation' },
      { key: 'database', status: 'local-json-sqlite-scaffold' },
      { key: 'auth', status: 'scaffold-needed-for-production' },
      { key: 'omr', status: 'beta-fallback' },
      { key: 'midi', status: 'plan-engine-ready-binary-export-pending' }
    ]
  }
}
